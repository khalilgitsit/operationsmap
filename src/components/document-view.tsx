'use client';

import { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
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
import { TiptapEditor } from '@/components/tiptap-editor';
import { ExportButton } from '@/components/export-button';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { getOrgSetting } from '@/server/actions/settings';
import { cn } from '@/lib/utils';

interface DocumentViewProps {
  config: ObjectConfig;
  recordId: string;
  /** Side panel mode - renders compact in a side panel */
  sidePanel?: boolean;
  /** Callback when side panel requests full page */
  onExpandToFullPage?: () => void;
}

// Fields that are displayed as dedicated sections, not in the properties grid
const CONTENT_FIELDS = ['content', 'trigger', 'end_state'];

export function DocumentView({ config, recordId, sidePanel = false, onExpandToFullPage }: DocumentViewProps) {
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
  const [assocVisibility, setAssocVisibility] = useState<Record<string, Record<string, boolean>> | null>(null);

  // Document View specific states
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!sidePanel);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    fetchAssocVisibility();
  }, [fetchRecord, fetchActivities, fetchAssociations, fetchAssocVisibility]);

  const handleFieldSave = (field: string, value: unknown) => {
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

  const handleContentSave = useCallback((field: string, html: string) => {
    startTransition(async () => {
      const result = await updateRecord(config.type, recordId, { [field]: html });
      if (result.success) {
        setRecord(result.data);
      }
    });
  }, [config.type, recordId]);

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

  // Split columns into property fields and content fields
  const propertyColumns = useMemo(() =>
    config.columns.filter(
      (col) => col.key !== config.titleField && !CONTENT_FIELDS.includes(col.key) && col.key !== 'description'
    ),
    [config]
  );

  const contentColumns = useMemo(() =>
    config.columns.filter((col) => CONTENT_FIELDS.includes(col.key)),
    [config]
  );

  if (loading) {
    return (
      <div className={cn(
        'flex flex-col gap-4',
        isFullscreen && 'fixed inset-0 z-50 bg-background p-6'
      )}>
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
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

  const title = getRecordTitle(record, config);

  return (
    <>
      <div
        className={cn(
          'flex h-[calc(100vh-140px)]',
          isFullscreen && 'fixed inset-0 z-50 bg-background p-6 h-screen',
          sidePanel && 'h-full'
        )}
      >
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Document Header */}
          <div className="shrink-0 pb-4">
            {/* Top bar with actions */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {sidePanel && onExpandToFullPage && (
                  <Button variant="ghost" size="sm" onClick={onExpandToFullPage} title="Open full page">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1">
                <ExportButton config={config} recordId={record.id as string} record={record} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                >
                  {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </Button>
                {!sidePanel && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Title */}
            <div className="mb-2">
              {editingField === config.titleField ? (
                <Input
                  autoFocus
                  className="text-2xl font-bold h-auto py-1 border-none shadow-none focus-visible:ring-0 px-0 text-foreground"
                  defaultValue={title}
                  onBlur={(e) => handleFieldSave(config.titleField, e.target.value || null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFieldSave(config.titleField, (e.target as HTMLInputElement).value || null);
                    if (e.key === 'Escape') setEditingField(null);
                  }}
                />
              ) : (
                <h1
                  className="text-2xl font-bold cursor-pointer hover:text-primary/80 transition-colors"
                  onClick={() => setEditingField(config.titleField)}
                >
                  {title || 'Untitled'}
                </h1>
              )}
            </div>

            {/* Status + quick meta row */}
            <DocumentMetaRow record={record} config={config} />
          </div>

          {/* Scrollable document body */}
          <ScrollArea className="flex-1 min-h-0">
            <div className={cn('pr-4 pb-8', sidePanel ? 'max-w-full' : 'max-w-4xl')}>
              {/* Collapsible Properties */}
              <div className="mb-4">
                <button
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
                  onClick={() => setPropertiesCollapsed(!propertiesCollapsed)}
                >
                  {propertiesCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  Properties
                </button>

                {!propertiesCollapsed && (
                  <div className="space-y-2 pl-5 border-l-2 border-muted ml-0.5">
                    {propertyColumns
                      .filter((col) => col.key !== config.statusField)
                      .map((col) => {
                        const value = record[col.key];
                        const isEditing = editingField === col.key;

                        return (
                          <div key={col.key} className="flex items-start gap-3 py-1">
                            <span className="text-xs text-muted-foreground shrink-0 w-32 pt-0.5">{col.label}</span>
                            <div className="flex-1 min-w-0">
                              {isEditing && col.editable ? (
                                <PropertyEditField
                                  col={col}
                                  value={value}
                                  onSave={(v: unknown) => handleFieldSave(col.key, v)}
                                  onCancel={() => setEditingField(null)}
                                  config={config}
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'text-sm',
                                    col.editable && 'cursor-pointer hover:bg-muted/50 rounded px-1.5 -mx-1.5 py-0.5'
                                  )}
                                  onClick={() => col.editable && setEditingField(col.key)}
                                >
                                  {renderPropertyValue(col, value, config)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Content editor sections */}
              {contentColumns.map((col) => (
                <div key={col.key} className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    {col.label}
                  </h3>
                  <TiptapEditor
                    content={(record[col.key] as string) || ''}
                    onChange={(html) => handleContentSave(col.key, html)}
                    placeholder={`Add ${col.label.toLowerCase()}...`}
                  />
                </div>
              ))}

              {/* Description editor (if exists and not in content fields) */}
              {config.columns.find((c) => c.key === 'description') && !CONTENT_FIELDS.includes('description') && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <TiptapEditor
                    content={(record.description as string) || ''}
                    onChange={(html) => handleContentSave('description', html)}
                    placeholder="Add description..."
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Sidebar — Associations & Activity */}
        {sidebarOpen && (
          <div className={cn(
            'border-l shrink-0 flex flex-col overflow-hidden',
            sidePanel ? 'w-64' : 'w-80'
          )}>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Associations */}
                <div>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Associations</h2>
                  <div className="space-y-3">
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
                          setCreateState({ config: targetConfig });
                        }}
                        collapsed={collapsedSections.has(assoc.junctionTable)}
                        onToggle={() => toggleSection(assoc.junctionTable)}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Activity Feed */}
                <div>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activity</h2>

                  {/* Comment Input */}
                  <div className="flex gap-2 mb-3">
                    <Textarea
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || isPending}
                      className="h-8 w-8 shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {activities.length > 0 ? (
                      activities.map((activity) => (
                        <ActivityEntry key={activity.id as string} activity={activity} />
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No activity yet</p>
                    )}
                    {activityCursor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => fetchActivities(activityCursor)}
                        disabled={loadingActivities}
                      >
                        {loadingActivities ? 'Loading...' : 'Load more'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

// --- Sub-components ---

function DocumentMetaRow({ record, config }: { record: Record<string, unknown>; config: ObjectConfig }) {
  const status = record[config.statusField] as string | undefined;
  const version = record.version as number | undefined;
  const lastReviewed = record.last_reviewed as string | undefined;
  const recordType = record.type as string | undefined;
  const updatedAt = record.updated_at as string | undefined;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {status && <StatusBadge status={status} />}
      {version != null && (
        <span className="text-xs text-muted-foreground">v{version}</span>
      )}
      {lastReviewed && (
        <span className="text-xs text-muted-foreground">
          Reviewed {new Date(lastReviewed).toLocaleDateString()}
        </span>
      )}
      {recordType && config.type === 'template' && (
        <span className="text-xs bg-muted px-2 py-0.5 rounded">{recordType}</span>
      )}
      {updatedAt && (
        <span className="text-xs text-muted-foreground">
          Modified {new Date(updatedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

function PropertyEditField({
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
          <SelectTrigger className="h-7 text-sm">
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
          className="h-7"
        />
      );
    case 'markdown':
      return (
        <Textarea
          autoFocus
          className="text-sm"
          defaultValue={(value as string) || ''}
          rows={3}
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
          className="h-7 text-sm"
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
          className="h-7 text-sm"
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

function renderPropertyValue(col: { key: string; type: string }, value: unknown, config: ObjectConfig): React.ReactNode {
  if (col.type === 'select' && col.key === config.statusField) {
    return <StatusBadge status={(value as string) || ''} />;
  }
  if (col.type === 'date' && value) {
    return new Date(value as string).toLocaleDateString();
  }
  if (col.type === 'currency' && value != null) {
    return `$${Number(value).toLocaleString()}`;
  }
  if (col.type === 'url' && value) {
    return <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all text-sm">{value as string}</a>;
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
    description = `Changed status from "${fmtVal(activity.old_value)}" to "${fmtVal(activity.new_value)}"`;
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
    description = `Updated ${fieldName}: "${fmtVal(activity.old_value)}" → "${fmtVal(activity.new_value)}"`;
  }

  return (
    <div className="text-xs border-l-2 border-muted pl-2 py-1">
      <p className={cn('flex-1', fieldName === '_comment' && 'font-medium')}>
        {description}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5" title={new Date(activity.created_at as string).toLocaleString()}>
        {formatRelativeTime(activity.created_at as string)}
      </p>
    </div>
  );
}

function fmtVal(v: unknown): string {
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
      const existingIds = new Set(items.map((i) => i.id as string));
      setSearchResults(result.data.filter((r) => !existingIds.has(r.id)));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-1 text-xs font-medium hover:text-primary" onClick={onToggle}>
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {assoc.label}
        </button>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">{items.length}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setAdding(!adding)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {adding && (
        <div className="mt-1.5 space-y-1.5">
          <Input
            placeholder={`Search ${assoc.targetLabel.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="h-7 text-xs"
          />
          {searchResults.length > 0 && (
            <div className="border rounded-md max-h-28 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  className="w-full text-left text-xs px-2 py-1 hover:bg-muted transition-colors"
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
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="text-[10px] h-6" onClick={onCreateNew}>
              Create New
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] h-6"
              onClick={() => { setAdding(false); setSearchQuery(''); setSearchResults([]); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!collapsed && (
        <div className="mt-1 space-y-0.5">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id as string}
                className="flex items-center justify-between group text-xs px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
              >
                <button
                  className="text-left truncate flex-1"
                  onClick={() => onPreview(assoc.targetType, item.id as string)}
                >
                  {targetConfig ? getRecordTitle(item, targetConfig) : (item.title as string) || ''}
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id as string);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground px-1.5 py-0.5">None yet</p>
          )}
        </div>
      )}
    </div>
  );
}
