'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ReferenceCombobox } from '@/components/reference-combobox';
import { PreviewPanel } from '@/components/preview-panel';
import { QuickCreatePanel } from '@/components/quick-create-panel';
import { VideoEmbed } from '@/components/video-embed';
import { CustomProperties } from '@/components/custom-properties';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Download, MoreHorizontal, Plus, Send, Trash2, X } from 'lucide-react';
import {
  type ObjectConfig,
  type AssociationConfig,
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
import { cn } from '@/lib/utils';

interface RecordViewProps {
  config: ObjectConfig;
  recordId: string;
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
  const [createState, setCreateState] = useState<{ config: ObjectConfig; defaults?: Record<string, unknown> } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchRecord = useCallback(async () => {
    setLoading(true);
    const result = await getRecord(config.type, recordId);
    if (result.success) {
      setRecord(result.data);
    }
    setLoading(false);
  }, [config.type, recordId]);

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

  useEffect(() => {
    fetchRecord();
    fetchActivities();
    fetchAssociations();
  }, [fetchRecord, fetchActivities, fetchAssociations]);

  const handleFieldSave = (field: string, value: unknown) => {
    startTransition(async () => {
      const result = await updateRecord(config.type, recordId, { [field]: value });
      if (result.success) {
        setRecord(result.data);
        fetchActivities();
      }
      setEditingField(null);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRecord(config.type, recordId);
      if (result.success) {
        router.push(config.listHref);
      }
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const text = commentText;
    setCommentText('');
    startTransition(async () => {
      await addComment(recordId, config.type, text);
      fetchActivities();
    });
  };

  const handleAddAssociation = async (assoc: AssociationConfig, targetId: string) => {
    if (assoc.junctionTable === '_children') return;
    await addAssociation(
      assoc.junctionTable as Parameters<typeof addAssociation>[0],
      recordId,
      targetId
    );
    fetchAssociations();
    fetchActivities();
  };

  const handleRemoveAssociation = async (assoc: AssociationConfig, targetId: string) => {
    if (assoc.junctionTable === '_children') return;
    await removeAssociation(
      assoc.junctionTable as Parameters<typeof removeAssociation>[0],
      recordId,
      targetId
    );
    fetchAssociations();
    fetchActivities();
  };

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_280px] gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_280px] gap-6">
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
          />

          {/* Fields */}
          <div className="space-y-3">
            {config.columns
              .filter((col): col is typeof col => col.key !== config.titleField && !(config.titleFields ?? []).includes(col.key))
              .map((col) => {
                const value = record[col.key];
                const isEditing = editingField === col.key;

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
                          {renderFieldValue(col, value, config)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Video embed for core_activity */}
          {config.type === 'core_activity' && !!record.video_url && (
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Video</span>
              <div className="mt-1">
                <VideoEmbed url={record.video_url as string} />
              </div>
            </div>
          )}

          {/* Custom Properties */}
          <CustomProperties recordId={recordId} objectType={config.type} />
        </div>

        {/* Middle Column — Activity Feed */}
        <div className="border-l pl-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Activity</h2>

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
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Associations</h2>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-4 pr-4">
              {config.associations.map((assoc) => (
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
                    setCreateState({ config: targetConfig, defaults });
                  }}
                  collapsed={collapsedSections.has(assoc.junctionTable)}
                  onToggle={() => toggleSection(assoc.junctionTable)}
                />
              ))}
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
          onCreated={() => fetchAssociations()}
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

function renderFieldValue(col: { key: string; type: string }, value: unknown, config: ObjectConfig): React.ReactNode {
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
  if (col.type === 'multi_select' && Array.isArray(value)) {
    return value.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).map((v) => (
          <span key={v} className="rounded bg-muted px-1.5 py-0.5 text-xs">{v}</span>
        ))}
      </div>
    ) : '—';
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
    description = `Updated ${fieldName}: "${formatVal(activity.old_value)}" → "${formatVal(activity.new_value)}"`;
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
  return String(v);
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

function RecordTitleBar({
  record,
  config,
  editingField,
  deleteDialogOpen,
  onSetEditingField,
  onFieldSave,
  onSetDeleteDialogOpen,
  onDelete,
}: {
  record: Record<string, unknown>;
  config: ObjectConfig;
  editingField: string | null;
  deleteDialogOpen: boolean;
  onSetEditingField: (field: string | null) => void;
  onFieldSave: (field: string, value: unknown) => void;
  onSetDeleteDialogOpen: (open: boolean) => void;
  onDelete: () => void;
}) {
  const title = getRecordTitle(record, config);
  const titleField = config.titleField;
  const isEditingTitle = editingField === titleField;

  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex-1 min-w-0">
        {isEditingTitle ? (
          <Input
            autoFocus
            className="text-xl font-semibold h-auto py-1"
            defaultValue={title}
            onBlur={(e) => onFieldSave(titleField, e.target.value || null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onFieldSave(titleField, (e.target as HTMLInputElement).value || null);
              if (e.key === 'Escape') onSetEditingField(null);
            }}
          />
        ) : (
          <h1
            className="text-xl font-semibold cursor-pointer hover:text-primary transition-colors"
            onClick={() => onSetEditingField(titleField)}
          >
            {title || 'Untitled'}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="outline" size="sm" disabled>
          <Download className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <AlertDialog open={deleteDialogOpen} onOpenChange={onSetDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
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
          </DropdownMenuContent>
        </DropdownMenu>
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
