'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ReferenceCombobox } from '@/components/reference-combobox';
import { MultiReferenceField } from '@/components/multi-reference-field';
import { SalaryRangeField } from '@/components/salary-range-field';
import { BenefitsField } from '@/components/benefits-field';
import { PreviewPanel } from '@/components/preview-panel';
import { QuickCreatePanel } from '@/components/quick-create-panel';
import { VideoEmbed } from '@/components/video-embed';
import { ProcessVisual } from '@/components/process-visual';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, Send, Settings, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ExportButton } from '@/components/export-button';
import {
  type ObjectConfig,
  type AssociationConfig,
  type ColumnConfig,
  getRecordTitle,
  getObjectConfig,
  OBJECT_CONFIGS,
} from '@/lib/object-config';
import {
  getRecord,
  updateRecord,
  deleteRecord,
  getActivityLog,
  getAssociations,
  addComment,
  searchRecords,
} from '@/server/actions/generic';
import { addAssociation, removeAssociation } from '@/server/actions/associations';
import { getOrgSetting } from '@/server/actions/settings';
import { getCoreActivityWorkflowContext, getCoreActivityWorkflows, type CoreActivityWorkflowContext } from '@/server/actions/workflow';
import { cn } from '@/lib/utils';

interface RecordViewProps {
  config: ObjectConfig;
  recordId: string;
}

interface CustomPropertyDef {
  id: string;
  property_name: string;
  property_type: string;
  options: string[] | null;
  position: number;
}

interface CustomPropertyValue {
  id: string;
  custom_property_id: string;
  value: unknown;
}

export function RecordView({ config, recordId }: RecordViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [activities, setActivities] = useState<Record<string, unknown>[]>([]);
  const [activityCursor, setActivityCursor] = useState<string | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [associations, setAssociations] = useState<Record<string, Record<string, unknown>[]>>({});
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState('');
  const [previewState, setPreviewState] = useState<{ type: string; id: string } | null>(null);
  const [createState, setCreateState] = useState<{ config: ObjectConfig; defaults?: Record<string, unknown>; assoc?: AssociationConfig } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assocVisibility, setAssocVisibility] = useState<Record<string, Record<string, boolean>> | null>(null);
  const [referenceLabels, setReferenceLabels] = useState<Record<string, { label: string; href: string }>>({});
  // 3.4.2: Workflow context for core activity numbering
  const [caWorkflowContext, setCaWorkflowContext] = useState<CoreActivityWorkflowContext | null>(null);
  const [caWorkflows, setCaWorkflows] = useState<{ id: string; title: string }[]>([]);
  // 3.4.4: Property order and custom properties for mixed arrangement
  const [propertyOrder, setPropertyOrder] = useState<string[] | null>(null);
  const [customProperties, setCustomProperties] = useState<CustomPropertyDef[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, CustomPropertyValue>>({});
  const [editingCustomProp, setEditingCustomProp] = useState<string | null>(null);
  const [customEditValue, setCustomEditValue] = useState<unknown>(null);

  const fetchAssocVisibility = useCallback(async () => {
    const result = await getOrgSetting('association_visibility');
    if (result.success && result.data) {
      setAssocVisibility(result.data as Record<string, Record<string, boolean>>);
    } else {
      setAssocVisibility({});
    }
  }, []);

  const fetchRecord = useCallback(async () => {
    setLoading(true);
    const result = await getRecord(config.type, recordId);
    if (result.success) {
      setRecord(result.data);
      // Resolve reference field UUIDs to human-readable labels
      const refCols = config.columns.filter(
        (col: ColumnConfig) => col.type === 'reference' && col.referenceType && result.data[col.key]
      );
      const newLabels: Record<string, { label: string; href: string }> = {};
      for (const col of refCols) {
        const refId = result.data[col.key] as string;
        if (!refId) continue;
        const refConfig = OBJECT_CONFIGS[col.referenceType!];
        if (!refConfig) continue;
        const refResult = await getRecord(col.referenceType!, refId);
        if (refResult.success && refResult.data) {
          newLabels[col.key] = {
            label: getRecordTitle(refResult.data, refConfig),
            href: refConfig.recordHref(refId),
          };
        }
      }
      setReferenceLabels(newLabels);
    }
    setLoading(false);
  }, [config.type, config.columns, recordId]);

  const fetchActivities = useCallback(async (cursor?: string) => {
    setLoadingActivities(true);
    const result = await getActivityLog(recordId, cursor);
    if (result.success) {
      if (cursor) {
        setActivities((prev) => [...prev, ...result.data.items]);
      } else {
        setActivities(result.data.items);
      }
      setActivityCursor(result.data.nextCursor);
    }
    setLoadingActivities(false);
  }, [recordId]);

  const fetchAssociations = useCallback(async () => {
    const results: Record<string, Record<string, unknown>[]> = {};
    for (const assoc of config.associations) {
      const result = await getAssociations(config.type, recordId, assoc.junctionTable, assoc.targetType);
      if (result.success) results[assoc.junctionTable] = result.data;
    }
    setAssociations(results);
  }, [config, recordId]);

  // 3.4.2: Fetch workflow context for core activity numbering
  const fetchCoreActivityContext = useCallback(async () => {
    if (config.type !== 'core_activity') return;
    const [ctxResult, wfResult] = await Promise.all([
      getCoreActivityWorkflowContext(recordId),
      getCoreActivityWorkflows(recordId),
    ]);
    if (ctxResult.success && ctxResult.data) setCaWorkflowContext(ctxResult.data);
    if (wfResult.success) setCaWorkflows(wfResult.data);
  }, [config.type, recordId]);

  // 3.4.4: Fetch property order and custom properties for mixed arrangement
  const fetchPropertyConfig = useCallback(async () => {
    const [orderResult, { createClient }] = await Promise.all([
      getOrgSetting('property_order'),
      import('@/lib/supabase/client'),
    ]);
    if (orderResult.success && orderResult.data) {
      const allOrders = orderResult.data as Record<string, string[]>;
      setPropertyOrder(allOrders[config.type] ?? null);
    }
    // Fetch custom properties
    const supabase = createClient();
    const { data: props } = await supabase
      .from('custom_properties')
      .select('*')
      .eq('object_type', config.type as 'function' | 'subfunction' | 'process' | 'core_activity' | 'person' | 'role' | 'software')
      .order('position', { ascending: true });
    if (props && props.length > 0) {
      setCustomProperties(props.map((p) => ({
        ...p,
        options: p.options as string[] | null,
      })));
      const propIds = props.map((p) => p.id);
      const { data: vals } = await supabase
        .from('custom_property_values')
        .select('*')
        .eq('record_id', recordId)
        .eq('record_type', config.type)
        .in('custom_property_id', propIds);
      if (vals) {
        const valueMap: Record<string, CustomPropertyValue> = {};
        for (const v of vals) {
          valueMap[v.custom_property_id] = { id: v.id, custom_property_id: v.custom_property_id, value: v.value };
        }
        setCustomValues(valueMap);
      }
    }
  }, [config.type, recordId]);

  useEffect(() => {
    fetchRecord();
    fetchActivities();
    fetchAssociations();
    fetchAssocVisibility();
    fetchCoreActivityContext();
    fetchPropertyConfig();
  }, [fetchRecord, fetchActivities, fetchAssociations, fetchAssocVisibility, fetchCoreActivityContext, fetchPropertyConfig]);

  const handleFieldSave = (field: string, value: unknown) => {
    // Core Activity status validation: cannot be Active without subfunction
    if (config.type === 'core_activity' && field === 'status' && value === 'Active') {
      if (!record?.subfunction_id) {
        toast.error('Cannot set status to Active without a primary Subfunction');
        setEditingField(null);
        return;
      }
    }

    startTransition(async () => {
      const result = await updateRecord(config.type, recordId, { [field]: value });
      if (result.success) {
        setRecord(result.data);
        fetchActivities();
        toast.success('Saved');
      } else {
        toast.error(result.error);
      }
      setEditingField(null);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRecord(config.type, recordId);
      if (result.success) {
        toast.success(`${config.label} deleted`);
        router.push(config.listHref);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText('');
    startTransition(async () => {
      const result = await addComment(recordId, config.type, text);
      if (result.success) {
        fetchActivities();
      } else {
        setCommentText(text);
        toast.error(result.error || 'Failed to add comment');
      }
    });
  };

  const handleAddAssociation = async (assoc: AssociationConfig, targetId: string) => {
    if (assoc.junctionTable === '_children') return;
    try {
      const result = await addAssociation(
        assoc.junctionTable as Parameters<typeof addAssociation>[0],
        recordId,
        targetId
      );
      if (!result.success) {
        toast.error(`Failed to add association: ${result.error}`);
        return;
      }
      toast.success('Association added');
      fetchAssociations();
      fetchActivities();
    } catch (err) {
      toast.error(`Failed to add association: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRemoveAssociation = async (assoc: AssociationConfig, targetId: string) => {
    if (assoc.junctionTable === '_children') return;
    try {
      const result = await removeAssociation(
        assoc.junctionTable as Parameters<typeof removeAssociation>[0],
        recordId,
        targetId
      );
      if (!result.success) {
        toast.error(`Failed to remove association: ${result.error}`);
        return;
      }
      toast.success('Association removed');
      fetchAssociations();
      fetchActivities();
    } catch (err) {
      toast.error(`Failed to remove association: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 3.4.4: Save custom property value
  const saveCustomValue = (propertyId: string, value: unknown) => {
    startTransition(async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const existing = customValues[propertyId];
      if (existing) {
        await supabase
          .from('custom_property_values')
          .update({ value: value as null })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('custom_property_values')
          .insert({
            custom_property_id: propertyId,
            record_id: recordId,
            record_type: config.type,
            value: value as null,
          } as never);
      }
      setCustomValues((prev) => ({
        ...prev,
        [propertyId]: { id: existing?.id || '', custom_property_id: propertyId, value },
      }));
      setEditingCustomProp(null);
      toast.success('Saved');
    });
  };

  // 3.4.4: Build unified property list (default + custom, ordered by saved order)
  const unifiedFields = useMemo(() => {
    // Build a list of all renderable fields
    type FieldItem = {
      key: string;
      kind: 'default' | 'custom';
      col?: ColumnConfig;
      customProp?: CustomPropertyDef;
    };

    // Default fields (excluding title and title fields)
    const defaultFields: FieldItem[] = config.columns
      .filter((col) => col.key !== config.titleField && !(config.titleFields ?? []).includes(col.key))
      .map((col) => ({ key: col.key, kind: 'default' as const, col }));

    // Custom property fields
    const customFields: FieldItem[] = customProperties.map((cp) => ({
      key: `custom_${cp.id}`,
      kind: 'custom' as const,
      customProp: cp,
    }));

    const allFields = [...defaultFields, ...customFields];

    // Apply saved order if available
    if (propertyOrder && propertyOrder.length > 0) {
      const orderMap = new Map(propertyOrder.map((key, idx) => [key, idx]));
      allFields.sort((a, b) => {
        const aIdx = orderMap.get(a.key) ?? 999;
        const bIdx = orderMap.get(b.key) ?? 999;
        return aIdx - bIdx;
      });
    }

    return allFields;
  }, [config, customProperties, propertyOrder]);

  // 3.4.1: Determine grid layout based on object type
  const isProcessPage = config.type === 'process';
  const gridClass = isProcessPage
    ? 'grid-cols-1 lg:grid-cols-[300px_1fr_280px]'
    : 'grid-cols-1 lg:grid-cols-[1fr_320px_280px]';

  if (loading) {
    return (
      <div className={`grid ${gridClass} gap-6`}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-muted-foreground">Record not found</p>
        <Button variant="outline" onClick={() => router.push(config.listHref)}>
          Back to {config.labelPlural}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={`grid ${gridClass} gap-6`}>
        {/* Left Column — Properties */}
        <div className="space-y-1">
          <RecordTitleBar
            record={record}
            config={config}
            editingField={editingField}
            deleteDialogOpen={deleteDialogOpen}
            onSetEditingField={setEditingField}
            onFieldSave={handleFieldSave}
            onSetDeleteDialogOpen={setDeleteDialogOpen}
            onDelete={handleDelete}
            numberPrefix={caWorkflowContext?.number}
          />

          {/* 3.4.4: Unified fields (default + custom, ordered) */}
          <div className="space-y-3">
            {unifiedFields.map((field) => {
              if (field.kind === 'default' && field.col) {
                const col = field.col;
                const value = record[col.key];
                const isEditing = editingField === col.key;

                // Multi-reference field (e.g., Other Functions on Role)
                if (col.type === 'multi_reference') {
                  return (
                    <div key={col.key} className="flex items-start gap-4 py-2">
                      <span className="text-sm text-muted-foreground shrink-0 w-36 pt-1">{col.label}</span>
                      <div className="flex-1 min-w-0">
                        <MultiReferenceField
                          referenceType={col.referenceType!}
                          value={Array.isArray(value) ? value as string[] : []}
                          onChange={(ids) => handleFieldSave(col.key, ids)}
                          editable={col.editable}
                        />
                      </div>
                    </div>
                  );
                }

                // Salary range field (renders two side-by-side currency inputs)
                if (col.type === 'salary_range') {
                  return (
                    <div key={col.key} className="flex items-start gap-4 py-2">
                      <span className="text-sm text-muted-foreground shrink-0 w-36 pt-1">{col.label}</span>
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => {
                          if (col.editable && !isEditing) setEditingField(col.key);
                        }}
                      >
                        <SalaryRangeField
                          min={record.salary_range_min as number | null}
                          max={record.salary_range_max as number | null}
                          editing={isEditing}
                          editable={col.editable}
                          onSave={(min, max) => {
                            startTransition(async () => {
                              const result = await updateRecord(config.type, recordId, {
                                salary_range_min: min,
                                salary_range_max: max,
                              });
                              if (result.success) {
                                setRecord(result.data);
                                fetchActivities();
                                toast.success('Saved');
                              } else {
                                toast.error(result.error);
                              }
                              setEditingField(null);
                            });
                          }}
                          onCancel={() => setEditingField(null)}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={col.key} className="flex items-start gap-4 py-2">
                    <span className="text-sm text-muted-foreground shrink-0 w-36 pt-1">{col.label}</span>
                    <div className="flex-1 min-w-0">
                      {isEditing && col.editable ? (
                        <EditableField
                          col={col}
                          value={value}
                          onSave={(v: unknown) => handleFieldSave(col.key, v)}
                          onCancel={() => setEditingField(null)}
                          config={config}
                        />
                      ) : (
                        <div
                          className={cn(
                            'text-sm py-1',
                            col.editable && 'cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2'
                          )}
                          onClick={() => col.editable && setEditingField(col.key)}
                        >
                          {renderFieldValue(col, value, config, referenceLabels)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Custom property field
              if (field.kind === 'custom' && field.customProp) {
                const cp = field.customProp;
                const currentValue = customValues[cp.id]?.value;
                const isEditing = editingCustomProp === cp.id;

                return (
                  <div key={field.key} className="flex items-start gap-4 py-2">
                    <span className="text-sm text-muted-foreground shrink-0 w-36 pt-1">{cp.property_name}</span>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <CustomPropertyInput
                          prop={cp}
                          value={customEditValue}
                          onChange={setCustomEditValue}
                          onSave={() => saveCustomValue(cp.id, customEditValue)}
                          onCancel={() => setEditingCustomProp(null)}
                        />
                      ) : (
                        <div
                          className="text-sm py-1 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
                          onClick={() => {
                            setEditingCustomProp(cp.id);
                            setCustomEditValue(currentValue ?? '');
                          }}
                        >
                          {formatCustomValue(currentValue, cp.property_type)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* 3.7.2: Benefits section for Person records */}
          {config.type === 'person' && (
            <div className="flex items-start gap-4 py-2">
              <span className="text-sm text-muted-foreground shrink-0 w-36 pt-1">Benefits</span>
              <div className="flex-1 min-w-0">
                <BenefitsField personId={recordId} />
              </div>
            </div>
          )}

          {/* Video embed for core_activity */}
          {config.type === 'core_activity' && !!record.video_url && (
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Video</span>
              <div className="mt-1">
                <VideoEmbed url={record.video_url as string} />
              </div>
            </div>
          )}
        </div>

        {/* Middle Column — Process Visual (for process pages) + Activity Feed */}
        <div className="border-l pl-6">
          {/* 3.4.1: Process visual for process record pages */}
          {isProcessPage && (
            <div className="mb-6">
              <ProcessVisual
                processId={recordId}
                onRefresh={() => {
                  fetchAssociations();
                  fetchActivities();
                }}
              />
            </div>
          )}

          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Activity</h2>

          {/* Comment Input */}
          <div className="flex gap-2 mb-4">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleAddComment}
              disabled={!commentText.trim() || isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-4 pr-4">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <ActivityEntry key={activity.id as string} activity={activity} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              )}
              {activityCursor && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => fetchActivities(activityCursor)}
                  disabled={loadingActivities}
                >
                  {loadingActivities ? 'Loading...' : 'Load more'}
                </Button>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Column — Associations */}
        <div className="border-l pl-6">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Associations</h2>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4 pr-4">
              {config.associations
                .filter((assoc) => assocVisibility?.[config.type]?.[assoc.junctionTable] !== false)
                .map((assoc) => (
                <AssociationSection
                  key={assoc.junctionTable}
                  assoc={assoc}
                  items={associations[assoc.junctionTable] || []}
                  recordId={recordId}
                  onPreview={(type, id) => setPreviewState({ type, id })}
                  onAdd={(targetId) => handleAddAssociation(assoc, targetId)}
                  onRemove={(targetId) => handleRemoveAssociation(assoc, targetId)}
                  onCreateNew={() => {
                    const targetConfig = getObjectConfig(assoc.targetType);
                    const defaults: Record<string, unknown> = {};
                    // Auto-populate parent reference for child records
                    if (assoc.junctionTable === '_children') {
                      if (config.type === 'function') defaults.function_id = recordId;
                      if (config.type === 'subfunction') defaults.subfunction_id = recordId;
                    }
                    setCreateState({ config: targetConfig, defaults, assoc });
                  }}
                  collapsed={collapsedSections.has(assoc.junctionTable)}
                  onToggle={() => toggleSection(assoc.junctionTable)}
                />
              ))}

              {/* 3.4.2: Computed Workflows association for core activities */}
              {config.type === 'core_activity' && caWorkflows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Workflows</span>
                    <span className="text-xs text-muted-foreground">{caWorkflows.length}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {caWorkflows.map((wf) => (
                      <div
                        key={wf.id}
                        className="text-sm px-2 py-1 rounded hover:bg-muted transition-colors"
                      >
                        <Link href={`/workflows/${wf.id}`} className="text-primary hover:underline">
                          {wf.title}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Preview Panel */}
      <PreviewPanel
        open={!!previewState}
        onOpenChange={(open) => !open && setPreviewState(null)}
        objectType={previewState?.type || ''}
        recordId={previewState?.id || null}
      />

      {/* Quick Create Panel */}
      {createState && (
        <QuickCreatePanel
          open={!!createState}
          onOpenChange={(open) => !open && setCreateState(null)}
          config={createState.config}
          defaults={createState.defaults}
          onCreated={async (newRecord) => {
            // Auto-link the newly created record to the current record
            if (createState.assoc && createState.assoc.junctionTable !== '_children' && newRecord?.id) {
              await handleAddAssociation(createState.assoc, newRecord.id as string);
            } else {
              fetchAssociations();
            }
          }}
        />
      )}
    </>
  );
}

function EditableField({
  col,
  value,
  onSave,
  onCancel,
  config,
}: {
  col: { key: string; type: string; options?: string[]; referenceType?: string };
  value: unknown;
  onSave: (v: unknown) => void;
  onCancel: () => void;
  config: ObjectConfig;
}) {
  switch (col.type) {
    case 'select':
      return (
        <Select value={(value as string) || ''} onValueChange={onSave}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(col.options || config.statusOptions).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'reference':
      return (
        <ReferenceCombobox
          referenceType={col.referenceType!}
          value={(value as string) || null}
          onChange={(id) => onSave(id)}
          className="h-8"
        />
      );

    case 'markdown':
      return (
        <Textarea
          autoFocus
          className="text-sm"
          defaultValue={(value as string) || ''}
          rows={4}
          onBlur={(e) => onSave(e.target.value || null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel();
          }}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          autoFocus
          className="h-8"
          defaultValue={value ? new Date(value as string).toISOString().split('T')[0] : ''}
          onBlur={(e) => onSave(e.target.value || null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave((e.target as HTMLInputElement).value || null);
            if (e.key === 'Escape') onCancel();
          }}
        />
      );

    case 'currency':
    case 'number':
      return (
        <Input
          type="number"
          autoFocus
          className="h-8"
          defaultValue={value as number ?? ''}
          onBlur={(e) => onSave(e.target.value ? Number(e.target.value) : null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave((e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null);
            if (e.key === 'Escape') onCancel();
          }}
        />
      );

    default:
      return (
        <Input
          autoFocus
          className="h-8"
          type={col.type === 'email' ? 'email' : col.type === 'url' ? 'url' : 'text'}
          defaultValue={(value as string) || ''}
          onBlur={(e) => onSave(e.target.value || null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave((e.target as HTMLInputElement).value || null);
            if (e.key === 'Escape') onCancel();
          }}
        />
      );
  }
}

function renderFieldValue(
  col: { key: string; type: string },
  value: unknown,
  config: ObjectConfig,
  referenceLabels?: Record<string, { label: string; href: string }>
): React.ReactNode {
  if (col.type === 'select' && col.key === config.statusField) {
    return <StatusBadge status={(value as string) || ''} />;
  }
  if (col.type === 'date' && value) {
    return new Date(value as string).toLocaleDateString();
  }
  if (col.type === 'currency' && value != null) {
    return `$${Number(value).toLocaleString()}`;
  }
  if (col.type === 'email' && value) {
    return <a href={`mailto:${value}`} className="text-primary hover:underline">{value as string}</a>;
  }
  if (col.type === 'url' && value) {
    return <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{value as string}</a>;
  }
  if (col.type === 'reference' && value) {
    const ref = referenceLabels?.[col.key];
    if (ref) {
      return (
        <Link href={ref.href} className="text-primary hover:underline">
          {ref.label}
        </Link>
      );
    }
    return <span className="text-muted-foreground italic">Loading...</span>;
  }
  if (col.type === 'multi_select' && Array.isArray(value)) {
    return value.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).map((v) => (
          <span key={v} className="rounded bg-muted px-1.5 py-0.5 text-xs">{v}</span>
        ))}
      </div>
    ) : <span className="text-muted-foreground">—</span>;
  }
  if (col.type === 'markdown' && value) {
    return <p className="whitespace-pre-wrap">{value as string}</p>;
  }
  return (value as string) || <span className="text-muted-foreground">—</span>;
}

function ActivityEntry({ activity }: { activity: Record<string, unknown> }) {
  const action = activity.action as string;
  const fieldName = activity.field_name as string | null;

  let description = '';
  if (action === 'created') {
    description = 'Created this record';
  } else if (action === 'status_changed') {
    description = `Changed status from "${formatVal(activity.old_value)}" to "${formatVal(activity.new_value)}"`;
  } else if (action === 'association_added') {
    description = `Added association (${fieldName})`;
  } else if (action === 'association_removed') {
    description = `Removed association (${fieldName})`;
  } else if (action === 'comment') {
    description = (activity.comment_text as string) || (activity.new_value as string) || 'Comment';
  } else if (fieldName === '_comment') {
    description = activity.new_value as string;
  } else if (fieldName === '_deleted') {
    description = 'Deleted this record';
  } else {
    const displayName = fieldName ? humanizeFieldName(fieldName) : 'field';
    description = `Updated ${displayName}: "${formatVal(activity.old_value)}" → "${formatVal(activity.new_value)}"`;
  }

  return (
    <div className="text-sm border-l-2 border-muted pl-3 py-1">
      <div className="flex items-center justify-between gap-2">
        <p className={cn('flex-1', fieldName === '_comment' && 'font-medium')}>
          {description}
        </p>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5" title={new Date(activity.created_at as string).toLocaleString()}>
        {formatRelativeTime(activity.created_at as string)}
      </p>
    </div>
  );
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return '(empty)';
  if (Array.isArray(v)) {
    if (v.length === 0) return '(empty)';
    return v.join(', ');
  }
  if (typeof v === 'object') {
    return JSON.stringify(v);
  }
  return String(v);
}

function humanizeFieldName(fieldName: string): string {
  return fieldName
    .replace(/_ids?$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// 3.4.2 + 3.4.3: Updated title bar with type badge, number prefix, and "Add Custom Field" menu item
function RecordTitleBar({
  record,
  config,
  editingField,
  deleteDialogOpen,
  onSetEditingField,
  onFieldSave,
  onSetDeleteDialogOpen,
  onDelete,
  numberPrefix,
}: {
  record: Record<string, unknown>;
  config: ObjectConfig;
  editingField: string | null;
  deleteDialogOpen: boolean;
  onSetEditingField: (field: string | null) => void;
  onFieldSave: (field: string, value: unknown) => void;
  onSetDeleteDialogOpen: (open: boolean) => void;
  onDelete: () => void;
  numberPrefix?: string;
}) {
  const router = useRouter();
  const title = getRecordTitle(record, config);
  const titleField = config.titleField;
  const isEditingTitle = editingField === titleField;

  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex-1 min-w-0">
        {isEditingTitle ? (
          <Input
            autoFocus
            className="text-xl font-medium h-auto py-1"
            defaultValue={title}
            onBlur={(e) => onFieldSave(titleField, e.target.value || null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onFieldSave(titleField, (e.target as HTMLInputElement).value || null);
              if (e.key === 'Escape') onSetEditingField(null);
            }}
          />
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {/* 3.4.2: Number prefix for core activities in workflows */}
            {numberPrefix && (
              <span className="text-sm font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">
                {numberPrefix}
              </span>
            )}
            <h1
              className="text-xl font-medium cursor-pointer hover:text-primary transition-colors"
              onClick={() => onSetEditingField(titleField)}
            >
              {title || 'Untitled'}
            </h1>
            {/* 3.4.2: Object type badge */}
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {config.label}
            </Badge>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <ExportButton config={config} recordId={record.id as string} record={record} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* 3.4.3: Add Custom Field option */}
            <DropdownMenuItem
              onSelect={() => router.push(`/settings/objects?type=${config.type}`)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Add Custom Field
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onSetDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialog open={deleteDialogOpen} onOpenChange={onSetDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {config.label}</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{title}&rdquo;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={onDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function AssociationSection({
  assoc,
  items,
  recordId,
  onPreview,
  onAdd,
  onRemove,
  onCreateNew,
  collapsed,
  onToggle,
}: {
  assoc: AssociationConfig;
  items: Record<string, unknown>[];
  recordId: string;
  onPreview: (type: string, id: string) => void;
  onAdd: (targetId: string) => void;
  onRemove: (targetId: string) => void;
  onCreateNew: () => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; label: string }[]>([]);
  const targetConfig = OBJECT_CONFIGS[assoc.targetType];

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    const result = await searchRecords(assoc.targetType, query, 10);
    if (result.success) {
      // Filter out already-associated items
      const existingIds = new Set(items.map((i) => i.id as string));
      setSearchResults(result.data.filter((r) => !existingIds.has(r.id)));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-1 text-sm font-medium hover:text-primary" onClick={onToggle}>
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {assoc.label}
        </button>
        {items.length > 0 && targetConfig ? (
          <Link
            href={targetConfig.listHref}
            className="text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {items.length}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">{items.length}</span>
        )}
        {assoc.junctionTable !== '_children' && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding(!adding)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
        {assoc.junctionTable === '_children' && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateNew}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {adding && (
        <div className="mt-2 space-y-2">
          <Input
            placeholder={`Search ${assoc.targetLabel.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="h-8 text-sm"
          />
          {searchResults.length > 0 && (
            <div className="border rounded-md max-h-32 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  className="w-full text-left text-sm px-3 py-1.5 hover:bg-muted transition-colors"
                  onClick={() => {
                    onAdd(result.id);
                    setAdding(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  {result.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={onCreateNew}>
              Create New
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => { setAdding(false); setSearchQuery(''); setSearchResults([]); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!collapsed && (
        <div className="mt-2 space-y-1">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id as string}
                className="flex items-center justify-between group text-sm px-2 py-1 rounded hover:bg-muted transition-colors"
              >
                <button
                  className="text-left truncate flex-1"
                  onClick={() => onPreview(assoc.targetType, item.id as string)}
                >
                  {targetConfig ? getRecordTitle(item, targetConfig) : (item.title as string) || ''}
                </button>
                {assoc.junctionTable !== '_children' && (
                  <button
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id as string);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-1">None yet</p>
          )}
        </div>
      )}
    </div>
  );
}

// 3.4.4: Custom property input component
function CustomPropertyInput({
  prop,
  value,
  onChange,
  onSave,
  onCancel,
}: {
  prop: CustomPropertyDef;
  value: unknown;
  onChange: (v: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  switch (prop.property_type) {
    case 'select':
      return (
        <Select value={(value as string) || ''} onValueChange={(v) => { onChange(v); }}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {(prop.options || []).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'number':
    case 'currency':
      return (
        <Input
          type="number"
          autoFocus
          className="h-8"
          value={value as number ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          onBlur={onSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
      );
    case 'date':
      return (
        <Input
          type="date"
          autoFocus
          className="h-8"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value || null)}
          onBlur={onSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
      );
    case 'boolean':
      return (
        <Select value={String(value || false)} onValueChange={(v) => { onChange(v === 'true'); }}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );
    default:
      return (
        <Input
          autoFocus
          className="h-8"
          type={prop.property_type === 'email' ? 'email' : prop.property_type === 'url' ? 'url' : 'text'}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value || null)}
          onBlur={onSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
      );
  }
}

function formatCustomValue(value: unknown, type: string): React.ReactNode {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">—</span>;
  if (type === 'boolean') return value ? 'Yes' : 'No';
  if (type === 'currency') return `$${Number(value).toLocaleString()}`;
  if (type === 'date') return new Date(value as string).toLocaleDateString();
  if (type === 'multi_select' && Array.isArray(value)) return (value as string[]).join(', ');
  return String(value);
}
