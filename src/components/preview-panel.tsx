'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/status-badge';
import { ReferenceCombobox } from '@/components/reference-combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink } from 'lucide-react';
import {
  type ObjectConfig,
  getRecordTitle,
  getObjectConfig,
  OBJECT_CONFIGS,
  isDocumentType,
} from '@/lib/object-config';
import { getRecord, updateRecord, getActivityLog, getAssociations } from '@/server/actions/generic';
import { DocumentView } from '@/components/document-view';

interface PreviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectType: string;
  recordId: string | null;
}

export function PreviewPanel({ open, onOpenChange, objectType, recordId }: PreviewPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [activities, setActivities] = useState<Record<string, unknown>[]>([]);
  const [associations, setAssociations] = useState<Record<string, Record<string, unknown>[]>>({});
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  // Stack for navigating between records within the panel
  const [stack, setStack] = useState<{ objectType: string; recordId: string }[]>([]);

  const currentType = stack.length > 0 ? stack[stack.length - 1].objectType : objectType;
  const currentId = stack.length > 0 ? stack[stack.length - 1].recordId : recordId;
  const config = currentType ? getObjectConfig(currentType) : null;

  const fetchData = useCallback(async () => {
    if (!currentId || !currentType || !config) return;
    setLoading(true);

    const [recordResult, activityResult] = await Promise.all([
      getRecord(currentType, currentId),
      getActivityLog(currentId, undefined, 5),
    ]);

    if (recordResult.success) setRecord(recordResult.data);
    if (activityResult.success) setActivities(activityResult.data.items);

    // Fetch associations
    const assocResults: Record<string, Record<string, unknown>[]> = {};
    for (const assoc of config.associations) {
      const result = await getAssociations(currentType, currentId, assoc.junctionTable, assoc.targetType);
      if (result.success) assocResults[assoc.junctionTable] = result.data;
    }
    setAssociations(assocResults);
    setLoading(false);
  }, [currentId, currentType, config]);

  useEffect(() => {
    if (open && currentId) {
      fetchData();
    }
  }, [open, currentId, fetchData]);

  // Reset stack when opening a new record from outside
  useEffect(() => {
    if (recordId && objectType) {
      setStack([]);
    }
  }, [recordId, objectType]);

  const handleFieldSave = (field: string, value: unknown) => {
    if (!currentId || !currentType) return;
    startTransition(async () => {
      const result = await updateRecord(currentType, currentId, { [field]: value });
      if (result.success) {
        setRecord(result.data);
      }
      setEditingField(null);
    });
  };

  const navigateToRecord = (type: string, id: string) => {
    setStack((prev) => [...prev, { objectType: type, recordId: id }]);
  };

  if (!config || !currentId) return null;

  // For document types, render DocumentView in side panel mode
  if (isDocumentType(currentType) && stack.length === 0) {
    return (
      <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setStack([]); setRecord(null); } }}>
        <SheetContent className="w-[50vw] sm:w-[50vw] max-w-3xl flex flex-col p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{config.label}</SheetTitle>
            <SheetDescription>{config.label} document view</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-4">
            <DocumentView
              config={config}
              recordId={currentId}
              sidePanel
              onExpandToFullPage={() => {
                onOpenChange(false);
                router.push(config.recordHref(currentId));
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setStack([]); setRecord(null); } }}>
      <SheetContent className="w-[400px] sm:w-[450px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">
              {record ? getRecordTitle(record, config) : 'Loading...'}
            </SheetTitle>
            <SheetDescription className="sr-only">{config.label} details</SheetDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2"
            onClick={() => {
              onOpenChange(false);
              router.push(config.recordHref(currentId));
            }}
          >
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            Open Full Record
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : record ? (
            <div className="px-6 pb-6 space-y-6">
              {/* Properties */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Properties</h3>
                {config.columns
                  .filter((col) => col.key !== config.titleField && !config.titleFields?.includes(col.key))
                  .slice(0, 8)
                  .map((col) => (
                    <div key={col.key} className="flex items-start justify-between gap-4">
                      <span className="text-sm text-muted-foreground shrink-0 w-28">{col.label}</span>
                      <div className="flex-1 text-sm text-right">
                        {editingField === col.key && col.editable ? (
                          renderEditField(col, record, handleFieldSave, () => setEditingField(null))
                        ) : (
                          <span
                            className={col.editable ? 'cursor-pointer hover:text-primary' : ''}
                            onClick={() => col.editable && setEditingField(col.key)}
                          >
                            {col.type === 'select' && col.key === config.statusField ? (
                              <StatusBadge status={(record[col.key] as string) || ''} />
                            ) : col.type === 'date' && record[col.key] ? (
                              new Date(record[col.key] as string).toLocaleDateString()
                            ) : col.type === 'currency' && record[col.key] != null ? (
                              `$${Number(record[col.key]).toLocaleString()}`
                            ) : (
                              (record[col.key] as string) || '—'
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              <Separator />

              {/* Associations */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Associations</h3>
                {config.associations.map((assoc) => {
                  const items = associations[assoc.junctionTable] || [];
                  const targetConfig = OBJECT_CONFIGS[assoc.targetType];
                  return (
                    <div key={assoc.junctionTable} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{assoc.label}</span>
                        <span className="text-xs text-muted-foreground">{items.length}</span>
                      </div>
                      {items.length > 0 ? (
                        <div className="space-y-1">
                          {items.slice(0, 5).map((item) => (
                            <button
                              key={item.id as string}
                              className="w-full text-left text-sm px-2 py-1 rounded hover:bg-muted transition-colors"
                              onClick={() => navigateToRecord(assoc.targetType, item.id as string)}
                            >
                              {targetConfig ? getRecordTitle(item, targetConfig) : (item.title as string) || (item.first_name as string) || ''}
                            </button>
                          ))}
                          {items.length > 5 && (
                            <p className="text-xs text-muted-foreground px-2">+{items.length - 5} more</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground px-2">None</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Recent Activity */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</h3>
                {activities.length > 0 ? (
                  <div className="space-y-2">
                    {activities.map((activity) => (
                      <div key={activity.id as string} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">
                            {formatActivityAction(activity)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.created_at as string)}
                          </span>
                        </div>
                        {(() => {
                          const fn = activity.field_name as string | null;
                          if (fn && fn !== '_deleted' && fn !== '_comment') {
                            return (
                              <p className="text-xs text-muted-foreground">
                                {fn}: {formatActivityValue(activity.old_value)} → {formatActivityValue(activity.new_value)}
                              </p>
                            );
                          }
                          if (fn === '_comment') {
                            return (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {String(activity.new_value)}
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No activity yet</p>
                )}
              </div>
            </div>
          ) : null}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function renderEditField(
  col: { key: string; type: string; options?: string[] },
  record: Record<string, unknown>,
  onSave: (field: string, value: unknown) => void,
  onCancel: () => void
) {
  if (col.type === 'select') {
    return (
      <Select
        value={(record[col.key] as string) || ''}
        onValueChange={(v) => onSave(col.key, v)}
      >
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {col.options?.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (col.type === 'reference') {
    return (
      <ReferenceCombobox
        referenceType={col.key.replace('_id', '')}
        value={(record[col.key] as string) || null}
        onChange={(id) => onSave(col.key, id)}
        className="h-8"
      />
    );
  }

  return (
    <Input
      autoFocus
      className="h-8"
      type={col.type === 'currency' || col.type === 'number' ? 'number' : col.type === 'email' ? 'email' : 'text'}
      defaultValue={(record[col.key] as string) || ''}
      onBlur={(e) => onSave(col.key, e.target.value || null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSave(col.key, (e.target as HTMLInputElement).value || null);
        if (e.key === 'Escape') onCancel();
      }}
    />
  );
}

function formatActivityAction(activity: Record<string, unknown>): string {
  const action = activity.action as string;
  if (action === 'created') return 'Created';
  if (action === 'status_changed') return 'Status changed';
  if (action === 'association_added') return 'Association added';
  if (action === 'association_removed') return 'Association removed';
  if (activity.field_name === '_comment') return 'Comment';
  if (activity.field_name === '_deleted') return 'Deleted';
  return 'Updated';
}

function formatActivityValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
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
