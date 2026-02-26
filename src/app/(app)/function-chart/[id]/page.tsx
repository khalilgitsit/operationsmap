'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/status-badge';
import { PreviewPanel } from '@/components/preview-panel';
import { QuickCreatePanel } from '@/components/quick-create-panel';
import { ReferenceCombobox } from '@/components/reference-combobox';
import { PageHeader } from '@/components/page-header';
import { getObjectConfig } from '@/lib/object-config';
import {
  getFunctionDetailData,
  reorderCoreActivities,
  type FunctionDetailCoreActivity,
} from '@/server/actions/function-chart';
import { Plus, GripVertical, Users, Monitor, Shield, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SubfunctionColumn {
  id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  coreActivities: FunctionDetailCoreActivity[];
}

export default function FunctionChartDetailPage() {
  const { id: functionId } = useParams<{ id: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [funcTitle, setFuncTitle] = useState('');
  const [columns, setColumns] = useState<SubfunctionColumn[]>([]);
  const [loading, setLoading] = useState(true);

  // Toggles
  const [showPeople, setShowPeople] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('fc-show-people') === 'true';
    return false;
  });
  const [showSoftware, setShowSoftware] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('fc-show-software') === 'true';
    return false;
  });
  const [showRoles, setShowRoles] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('fc-show-roles') === 'true';
    return false;
  });

  // Filters
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterSoftware, setFilterSoftware] = useState<string | null>(null);

  // Panels
  const [previewState, setPreviewState] = useState<{ type: string; id: string } | null>(null);
  const [createState, setCreateState] = useState<{
    type: string;
    defaults?: Record<string, unknown>;
  } | null>(null);

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getFunctionDetailData(functionId);
    if (result.success) {
      setFuncTitle(result.data.func.title);
      setColumns(result.data.subfunctions);
    }
    setLoading(false);
  }, [functionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter core activities
  const getFilteredActivities = (activities: FunctionDetailCoreActivity[]) => {
    return activities.filter((ca) => {
      if (filterPerson && !ca.people.some((p) => p.id === filterPerson)) return false;
      if (filterRole && !ca.roles.some((r) => r.id === filterRole)) return false;
      if (filterSoftware && !ca.software.some((s) => s.id === filterSoftware)) return false;
      return true;
    });
  };

  const hasActiveFilters = filterPerson || filterRole || filterSoftware;

  const clearFilters = () => {
    setFilterPerson(null);
    setFilterRole(null);
    setFilterSoftware(null);
  };

  // Find which column a CA belongs to
  const findColumnForCA = (caId: string): string | null => {
    for (const col of columns) {
      if (col.coreActivities.some((ca) => ca.id === caId)) return col.id;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeColId = findColumnForCA(active.id as string);
    // Check if over is a column ID or a CA ID
    let overColId = findColumnForCA(over.id as string);
    if (!overColId) {
      // Might be dropping over the column container itself
      overColId = columns.find((c) => c.id === over.id)?.id || null;
    }

    if (!activeColId || !overColId || activeColId === overColId) return;

    // Move the item to the new column
    setColumns((prev) => {
      const activeCol = prev.find((c) => c.id === activeColId);
      const overCol = prev.find((c) => c.id === overColId);
      if (!activeCol || !overCol) return prev;

      const activeCA = activeCol.coreActivities.find((ca) => ca.id === active.id);
      if (!activeCA) return prev;

      return prev.map((col) => {
        if (col.id === activeColId) {
          return {
            ...col,
            coreActivities: col.coreActivities.filter((ca) => ca.id !== active.id),
          };
        }
        if (col.id === overColId) {
          const overIndex = col.coreActivities.findIndex((ca) => ca.id === over.id);
          const newActivities = [...col.coreActivities];
          if (overIndex >= 0) {
            newActivities.splice(overIndex, 0, { ...activeCA, subfunction_id: col.id });
          } else {
            newActivities.push({ ...activeCA, subfunction_id: col.id });
          }
          return { ...col, coreActivities: newActivities };
        }
        return col;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeColId = findColumnForCA(active.id as string);
    if (!activeColId) return;

    // Same column reorder
    if (active.id !== over.id) {
      const overColId = findColumnForCA(over.id as string) || activeColId;
      if (activeColId === overColId) {
        setColumns((prev) =>
          prev.map((col) => {
            if (col.id !== activeColId) return col;
            const oldIndex = col.coreActivities.findIndex((ca) => ca.id === active.id);
            const newIndex = col.coreActivities.findIndex((ca) => ca.id === over.id);
            if (oldIndex === -1 || newIndex === -1) return col;
            return { ...col, coreActivities: arrayMove(col.coreActivities, oldIndex, newIndex) };
          })
        );
      }
    }

    // Save positions for all CAs in affected columns
    startTransition(async () => {
      const updates: { id: string; position: number; subfunction_id?: string }[] = [];
      for (const col of columns) {
        // After state update, recalculate from current state
        col.coreActivities.forEach((ca, i) => {
          updates.push({
            id: ca.id,
            position: i,
            subfunction_id: col.id,
          });
        });
      }
      await reorderCoreActivities(updates);
    });
  };

  // Find the active CA for the drag overlay
  const activeCA = activeId
    ? columns.flatMap((c) => c.coreActivities).find((ca) => ca.id === activeId)
    : null;

  if (loading) {
    return (
      <div>
        <PageHeader title="Function Detail" backHref="/function-chart" backLabel="Function Chart" />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        {/* Breadcrumb */}
        <div className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/function-chart" className="hover:text-foreground transition-colors">
            Function Chart
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{funcTitle}</span>
        </div>
        <h1 className="text-2xl font-bold mb-6">{funcTitle}</h1>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1">
            <ToggleButton
              active={showPeople}
              onClick={() => setShowPeople((v) => !v)}
              icon={<Users className="h-4 w-4" />}
              label="People"
            />
            <ToggleButton
              active={showSoftware}
              onClick={() => setShowSoftware((v) => !v)}
              icon={<Monitor className="h-4 w-4" />}
              label="Software"
            />
            <ToggleButton
              active={showRoles}
              onClick={() => setShowRoles((v) => !v)}
              icon={<Shield className="h-4 w-4" />}
              label="Roles"
            />
          </div>

          <div className="h-6 w-px bg-border mx-1" />

          {/* Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter:</span>
            <div className="w-[160px]">
              <ReferenceCombobox
                referenceType="person"
                value={filterPerson}
                onChange={(id) => setFilterPerson(id)}
                placeholder="Person..."
                className="h-8"
              />
            </div>
            <div className="w-[160px]">
              <ReferenceCombobox
                referenceType="role"
                value={filterRole}
                onChange={(id) => setFilterRole(id)}
                placeholder="Role..."
                className="h-8"
              />
            </div>
            <div className="w-[160px]">
              <ReferenceCombobox
                referenceType="software"
                value={filterSoftware}
                onChange={(id) => setFilterSoftware(id)}
                placeholder="Software..."
                className="h-8"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-4">
            {filterPerson && (
              <Badge variant="secondary" className="gap-1">
                Person filter active
                <button onClick={() => setFilterPerson(null)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filterRole && (
              <Badge variant="secondary" className="gap-1">
                Role filter active
                <button onClick={() => setFilterRole(null)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filterSoftware && (
              <Badge variant="secondary" className="gap-1">
                Software filter active
                <button onClick={() => setFilterSoftware(null)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Subfunction columns with Core Activities */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-6 min-h-[400px]">
            {columns.map((col) => {
              const filteredCAs = getFilteredActivities(col.coreActivities);
              return (
                <div
                  key={col.id}
                  className="flex-shrink-0 w-[280px] bg-muted/30 rounded-lg border"
                >
                  {/* Subfunction header */}
                  <div className="p-3 border-b bg-muted/50 rounded-t-lg">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <h3 className="font-semibold text-sm truncate">
                              {col.title}
                            </h3>
                          </TooltipTrigger>
                          {col.description && (
                            <TooltipContent side="bottom" className="max-w-[300px]">
                              <p className="text-xs">{col.description}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <StatusBadge status={col.status} />
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary flex-shrink-0"
                            onClick={() =>
                              setCreateState({
                                type: 'core_activity',
                                defaults: { subfunction_id: col.id },
                              })
                            }
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Add Core Activity</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Core Activity cards */}
                  <div className="p-2 space-y-2 min-h-[100px]">
                    <SortableContext
                      items={filteredCAs.map((ca) => ca.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {filteredCAs.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          {hasActiveFilters
                            ? 'No matching activities'
                            : 'Add Core Activities to this Subfunction'}
                        </p>
                      ) : (
                        filteredCAs.map((ca) => (
                          <SortableCoreActivityCard
                            key={ca.id}
                            coreActivity={ca}
                            showPeople={showPeople}
                            showSoftware={showSoftware}
                            showRoles={showRoles}
                            onPreview={() =>
                              setPreviewState({ type: 'core_activity', id: ca.id })
                            }
                            onNavigate={() => router.push(`/core-activities/${ca.id}`)}
                          />
                        ))
                      )}
                    </SortableContext>
                  </div>

                  {/* Single add button at bottom */}
                  <div className="px-2 pb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs text-muted-foreground hover:text-primary"
                      onClick={() =>
                        setCreateState({
                          type: 'core_activity',
                          defaults: { subfunction_id: col.id },
                        })
                      }
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Core Activity
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeCA ? (
              <div className="bg-background rounded-md border p-3 shadow-lg w-[260px] opacity-90">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{activeCA.title}</span>
                  <StatusBadge status={activeCA.status} />
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

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
            open={true}
            onOpenChange={(open) => !open && setCreateState(null)}
            config={getObjectConfig(createState.type)}
            defaults={createState.defaults}
            onCreated={() => {
              setCreateState(null);
              fetchData();
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      className="h-8 gap-1.5"
      onClick={onClick}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

function SortableCoreActivityCard({
  coreActivity,
  showPeople,
  showSoftware,
  showRoles,
  onPreview,
  onNavigate,
}: {
  coreActivity: FunctionDetailCoreActivity;
  showPeople: boolean;
  showSoftware: boolean;
  showRoles: boolean;
  onPreview: () => void;
  onNavigate: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: coreActivity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className="group bg-background rounded-md border p-3 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={onPreview}
        >
          <div className="flex items-start gap-2">
            <button
              className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  className="text-sm font-medium truncate hover:text-primary hover:underline text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate();
                  }}
                >
                  {coreActivity.title}
                </button>
                <StatusBadge status={coreActivity.status} />
              </div>

              {/* People avatars */}
              {showPeople && coreActivity.people.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {coreActivity.people.slice(0, 5).map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
                      title={`${p.first_name} ${p.last_name}`}
                    >
                      {p.first_name[0]}{p.last_name[0]}
                    </span>
                  ))}
                  {coreActivity.people.length > 5 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{coreActivity.people.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Software icons */}
              {showSoftware && coreActivity.software.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {coreActivity.software.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
                      title={s.title}
                    >
                      <Monitor className="h-3 w-3" />
                      {s.title.length > 12 ? s.title.slice(0, 12) + '...' : s.title}
                    </span>
                  ))}
                </div>
              )}

              {/* Role tags */}
              {showRoles && coreActivity.roles.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {coreActivity.roles.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded"
                    >
                      <Shield className="h-3 w-3" />
                      {r.title.length > 15 ? r.title.slice(0, 15) + '...' : r.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      {coreActivity.description && (
        <TooltipContent side="right" className="max-w-[300px]">
          <p className="text-xs">{coreActivity.description}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
