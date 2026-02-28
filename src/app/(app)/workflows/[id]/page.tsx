'use client';

import React, { useState, useEffect, useCallback, useTransition, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/status-badge';
import { PreviewPanel } from '@/components/preview-panel';
import { PageHeader } from '@/components/page-header';
import {
  getWorkflowMapData,
  updateWorkflow,
  createPhase,
  updatePhase,
  deletePhase,
  reorderPhases,
  createProcessInPhase,
  addProcessToPhase,
  removeProcessFromPhase,
  reorderProcessesInPhase,
  createCoreActivityInProcess,
  addCoreActivityToProcess,
  removeCoreActivityFromProcess,
  reorderCoreActivitiesInProcess,
  createHandoffBlock,
  updateHandoffBlock,
  deleteHandoffBlock,
  type WorkflowMapData,
  type WorkflowMapPhase,
  type WorkflowMapProcess,
  type WorkflowMapCoreActivity,
} from '@/server/actions/workflow';
import { searchRecords } from '@/server/actions/generic';
import { getWorkflowExportData } from '@/server/actions/export';
import { exportWorkflow, downloadMarkdown, copyToClipboard } from '@/lib/markdown-export';
import { ImportDialog } from '@/components/import-dialog';
import { toast } from 'sonner';
import {
  Plus,
  GripVertical,
  Users,
  Monitor,
  Shield,
  X,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit3,
  Search,
  ArrowRightLeft,
  Eye,
  Download,
  Copy,
  FileDown,
  Upload,
} from 'lucide-react';

type VisibilityMode = 'all' | 'active' | 'not-archived';

export default function WorkflowMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workflowId } = use(params);
  const [, startTransition] = useTransition();
  const [data, setData] = useState<WorkflowMapData | null>(null);
  const [loading, setLoading] = useState(true);

  // Toggle states
  const [showPeople, setShowPeople] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('wf-show-people') === 'true';
    return false;
  });
  const [showSoftware, setShowSoftware] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('wf-show-software') === 'true';
    return false;
  });
  const [showRoles, setShowRoles] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('wf-show-roles') === 'true';
    return false;
  });
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('wf-visibility') as VisibilityMode) || 'not-archived';
    return 'not-archived';
  });

  // Panel states
  const [previewState, setPreviewState] = useState<{ type: string; id: string } | null>(null);
  const [deletePhaseId, setDeletePhaseId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Editing states
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [statusValue, setStatusValue] = useState('Draft');

  // Drag state
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getWorkflowMapData(workflowId);
    if (result.success) {
      setData(result.data);
      setTitleValue(result.data.title);
      setStatusValue(result.data.status);
    }
    setLoading(false);
  }, [workflowId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Persist toggles
  useEffect(() => { localStorage.setItem('wf-show-people', String(showPeople)); }, [showPeople]);
  useEffect(() => { localStorage.setItem('wf-show-software', String(showSoftware)); }, [showSoftware]);
  useEffect(() => { localStorage.setItem('wf-show-roles', String(showRoles)); }, [showRoles]);
  useEffect(() => { localStorage.setItem('wf-visibility', visibilityMode); }, [visibilityMode]);

  // Filter by visibility
  const filterByStatus = useCallback((status: string) => {
    if (visibilityMode === 'all') return true;
    if (visibilityMode === 'active') return status === 'Active';
    if (visibilityMode === 'not-archived') return status !== 'Archived';
    return true;
  }, [visibilityMode]);

  const handleTitleSave = async () => {
    if (!titleValue.trim() || titleValue === data?.title) {
      setEditingTitle(false);
      return;
    }
    startTransition(async () => {
      await updateWorkflow(workflowId, { title: titleValue.trim() });
      setData((d) => d ? { ...d, title: titleValue.trim() } : d);
      setEditingTitle(false);
    });
  };

  const handleAddPhase = (position: number) => {
    startTransition(async () => {
      // Shift existing phases down if inserting in the middle
      if (data) {
        const phasesToShift = data.phases.filter((p) => p.position >= position);
        if (phasesToShift.length > 0) {
          await reorderPhases(phasesToShift.map((p) => ({ id: p.id, position: p.position + 1 })));
        }
      }
      await createPhase(workflowId, position);
      await fetchData();
    });
  };

  const handleDeletePhase = () => {
    if (!deletePhaseId) return;
    startTransition(async () => {
      await deletePhase(deletePhaseId);
      setDeletePhaseId(null);
      await fetchData();
    });
  };

  const handlePhaseDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !data) return;

    const oldIndex = data.phases.findIndex((p) => p.id === active.id);
    const newIndex = data.phases.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(data.phases, oldIndex, newIndex);
    setData({ ...data, phases: reordered });
    const updates = reordered.map((p, i) => ({ id: p.id, position: i }));
    startTransition(() => { reorderPhases(updates); });
    setActivePhaseId(null);
  };

  const handlePhaseDragStart = (event: DragStartEvent) => {
    setActivePhaseId(event.active.id as string);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Workflow Map" backHref="/workflows" backLabel="All Workflows" />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="Workflow Map" backHref="/workflows" backLabel="All Workflows" />
        <p className="text-muted-foreground py-8 text-center">Workflow not found.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        <PageHeader
          title=""
          backHref="/workflows"
          backLabel="All Workflows"
        />

        {/* Workflow Title + Status */}
        <div className="mb-4 flex items-center gap-3">
          {editingTitle ? (
            <Input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') { setTitleValue(data.title); setEditingTitle(false); }
              }}
              className="text-2xl font-bold h-auto py-1 px-2 max-w-lg"
            />
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer hover:text-primary/80 transition-colors inline-block"
              onClick={() => setEditingTitle(true)}
              title="Click to edit"
            >
              {data.title}
            </h1>
          )}
          <Select
            value={statusValue}
            onValueChange={(v) => {
              const newStatus = v as 'Draft' | 'Active' | 'Archived';
              setStatusValue(newStatus);
              setData((d) => d ? { ...d, status: newStatus } : d);
              startTransition(async () => {
                await updateWorkflow(workflowId, { status: newStatus });
              });
            }}
          >
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Draft', 'Active', 'Archived'].map((s) => (
                <SelectItem key={s} value={s}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusDotColor(s)}`} />
                    {s}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Visibility toggle */}
          <Select value={visibilityMode} onValueChange={(v) => setVisibilityMode(v as VisibilityMode)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Show All</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="not-archived">Hide Archived</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 ml-2">
            <ToggleButton active={showPeople} onClick={() => setShowPeople((v) => !v)} icon={<Users className="h-4 w-4" />} label="People" />
            <ToggleButton active={showSoftware} onClick={() => setShowSoftware((v) => !v)} icon={<Monitor className="h-4 w-4" />} label="Software" />
            <ToggleButton active={showRoles} onClick={() => setShowRoles((v) => !v)} icon={<Shield className="h-4 w-4" />} label="Roles" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5 mr-1" />
              Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    startTransition(async () => {
                      const result = await getWorkflowExportData(workflowId);
                      if (result.success) {
                        const md = exportWorkflow(result.data);
                        const slug = (data?.title || 'workflow').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        downloadMarkdown(md, `${slug}.md`);
                        toast.success('Downloaded as markdown');
                      }
                    });
                  }}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Download as .md
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    startTransition(async () => {
                      const result = await getWorkflowExportData(workflowId);
                      if (result.success) {
                        const md = exportWorkflow(result.data);
                        const ok = await copyToClipboard(md);
                        if (ok) toast.success('Copied to clipboard');
                        else toast.error('Failed to copy');
                      }
                    });
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-2">
          {/* Add phase at top */}
          <AddPhaseButton onClick={() => handleAddPhase(0)} />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePhaseDragEnd}
            onDragStart={handlePhaseDragStart}
          >
            <SortableContext items={data.phases.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {data.phases.map((phase, phaseIndex) => (
                <div key={phase.id}>
                  <SortablePhase
                    phase={phase}
                    phaseNumber={phaseIndex + 1}
                    showPeople={showPeople}
                    showSoftware={showSoftware}
                    showRoles={showRoles}
                    filterByStatus={filterByStatus}
                    onPreview={setPreviewState}
                    onDeletePhase={setDeletePhaseId}
                    onRefresh={fetchData}
                    startTransition={startTransition}
                  />
                  {/* Handoff blocks after this phase */}
                  {phase.handoffs.map((handoff) => (
                    <HandoffBlock
                      key={handoff.id}
                      handoff={handoff}
                      onUpdate={(label) => {
                        startTransition(async () => {
                          await updateHandoffBlock(handoff.id, { label });
                          await fetchData();
                        });
                      }}
                      onDelete={() => {
                        startTransition(async () => {
                          await deleteHandoffBlock(handoff.id);
                          await fetchData();
                        });
                      }}
                    />
                  ))}
                  {/* Add buttons between phases */}
                  <div className="flex items-center gap-2 justify-center py-1">
                    <AddPhaseButton onClick={() => handleAddPhase(phaseIndex + 1)} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => {
                        const nextPhase = data.phases[phaseIndex + 1];
                        startTransition(async () => {
                          await createHandoffBlock(
                            workflowId,
                            `Handoff: ${phase.title} → ${nextPhase?.title || '...'}`,
                            phase.id,
                            nextPhase?.id || null,
                            phase.handoffs.length
                          );
                          await fetchData();
                        });
                      }}
                    >
                      <ArrowRightLeft className="h-3 w-3 mr-1" />
                      Add Handoff
                    </Button>
                  </div>
                </div>
              ))}
            </SortableContext>

            <DragOverlay>
              {activePhaseId && data.phases.find((p) => p.id === activePhaseId) && (
                <div className="bg-background border-2 border-primary/50 rounded-lg p-4 opacity-80 shadow-lg">
                  <span className="font-semibold">
                    {data.phases.find((p) => p.id === activePhaseId)?.title}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {data.phases.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="mb-4">No phases yet. Add your first phase to start building this workflow.</p>
              <Button onClick={() => handleAddPhase(0)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Phase
              </Button>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <PreviewPanel
          open={!!previewState}
          onOpenChange={(open) => !open && setPreviewState(null)}
          objectType={previewState?.type || ''}
          recordId={previewState?.id || null}
        />

        {/* Delete Phase dialog */}
        <AlertDialog open={!!deletePhaseId} onOpenChange={(open) => !open && setDeletePhaseId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Phase</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove this phase and unlink all processes within it. The processes themselves will not be deleted. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePhase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Markdown Import Dialog */}
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          importType="workflow"
          onImported={fetchData}
        />
      </div>
    </TooltipProvider>
  );
}

// --- Sub-components ---

function ToggleButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <Button variant={active ? 'default' : 'outline'} size="sm" className="h-8 gap-1.5" onClick={onClick}>
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

function AddPhaseButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center">
      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary" onClick={onClick}>
        <Plus className="h-3 w-3 mr-1" />
        Add Phase
      </Button>
    </div>
  );
}

// Sortable Phase Component
function SortablePhase({
  phase,
  phaseNumber,
  showPeople,
  showSoftware,
  showRoles,
  filterByStatus,
  onPreview,
  onDeletePhase,
  onRefresh,
  startTransition,
}: {
  phase: WorkflowMapPhase;
  phaseNumber: number;
  showPeople: boolean;
  showSoftware: boolean;
  showRoles: boolean;
  filterByStatus: (status: string) => boolean;
  onPreview: (state: { type: string; id: string }) => void;
  onDeletePhase: (id: string) => void;
  onRefresh: () => Promise<void>;
  startTransition: React.TransitionStartFunction;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleValue, setTitleValue] = useState(phase.title);
  const [descValue, setDescValue] = useState(phase.description || '');
  const [collapsed, setCollapsed] = useState(false);
  const [showAddProcess, setShowAddProcess] = useState(false);

  // DnD sensors for processes and CAs within this phase
  const processSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const caSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Local state for cross-process CA drag
  const [localProcesses, setLocalProcesses] = useState(phase.processes);
  useEffect(() => { setLocalProcesses(phase.processes); }, [phase.processes]);
  const [activeDragCAId, setActiveDragCAId] = useState<string | null>(null);
  const localProcessesRef = useRef(localProcesses);
  localProcessesRef.current = localProcesses;

  // Find which process a CA belongs to
  const findProcessForCA = (caId: string): string | null => {
    for (const proc of localProcesses) {
      if (proc.coreActivities.some((ca) => ca.id === caId)) return proc.id;
    }
    return null;
  };

  const handleCADragStart = (event: DragStartEvent) => {
    setActiveDragCAId(event.active.id as string);
  };

  const handleCADragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeProcessId = findProcessForCA(active.id as string);
    let overProcessId = findProcessForCA(over.id as string);
    // If over is a process container itself (empty process drop zone)
    if (!overProcessId) {
      overProcessId = localProcesses.find((p) => p.id === over.id)?.id || null;
    }

    if (!activeProcessId || !overProcessId || activeProcessId === overProcessId) return;

    // Move CA from source to target process
    setLocalProcesses((prev) => {
      const sourceProc = prev.find((p) => p.id === activeProcessId);
      const targetProc = prev.find((p) => p.id === overProcessId);
      if (!sourceProc || !targetProc) return prev;

      const activeCA = sourceProc.coreActivities.find((ca) => ca.id === active.id);
      if (!activeCA) return prev;

      return prev.map((p) => {
        if (p.id === activeProcessId) {
          return { ...p, coreActivities: p.coreActivities.filter((ca) => ca.id !== active.id) };
        }
        if (p.id === overProcessId) {
          const overIndex = p.coreActivities.findIndex((ca) => ca.id === over.id);
          const newCAs = [...p.coreActivities];
          if (overIndex >= 0) {
            newCAs.splice(overIndex, 0, activeCA);
          } else {
            newCAs.push(activeCA);
          }
          return { ...p, coreActivities: newCAs };
        }
        return p;
      });
    });
  };

  const handleCADragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragCAId(null);

    if (!over) return;

    const activeProcessId = findProcessForCA(active.id as string);
    if (!activeProcessId) return;

    // Same-process reorder
    let updatedProcesses = localProcessesRef.current;
    if (active.id !== over.id) {
      const overProcessId = findProcessForCA(over.id as string) || activeProcessId;
      if (activeProcessId === overProcessId) {
        updatedProcesses = updatedProcesses.map((p) => {
          if (p.id !== activeProcessId) return p;
          const oldIndex = p.coreActivities.findIndex((ca) => ca.id === active.id);
          const newIndex = p.coreActivities.findIndex((ca) => ca.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return p;
          return { ...p, coreActivities: arrayMove(p.coreActivities, oldIndex, newIndex) };
        });
        setLocalProcesses(updatedProcesses);
      }
    }

    // Persist all CA positions across all processes
    const updates: { processId: string; coreActivityId: string; position: number }[] = [];
    for (const proc of updatedProcesses) {
      proc.coreActivities.forEach((ca, i) => {
        updates.push({ processId: proc.id, coreActivityId: ca.id, position: i });
      });
    }
    if (updates.length > 0) {
      startTransition(async () => {
        await reorderCoreActivitiesInProcess(updates);
        await onRefresh();
      });
    }
  };

  // Active CA for drag overlay
  const activeDragCA = activeDragCAId
    ? localProcesses.flatMap((p) => p.coreActivities).find((ca) => ca.id === activeDragCAId)
    : null;

  // Get status color for the phase header stripe
  const statusColor = getStatusBorderColor(phase.status);

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== phase.title) {
      startTransition(async () => {
        await updatePhase(phase.id, { title: titleValue.trim() });
        await onRefresh();
      });
    }
    setEditingTitle(false);
  };

  const handleDescSave = () => {
    if (descValue !== (phase.description || '')) {
      startTransition(async () => {
        await updatePhase(phase.id, { description: descValue.trim() || undefined });
        await onRefresh();
      });
    }
    setEditingDesc(false);
  };

  const [addProcessAtPosition, setAddProcessAtPosition] = useState<number | null>(null);

  const handleAddProcess = (title: string, position?: number) => {
    const pos = position ?? phase.processes.length;
    startTransition(async () => {
      await createProcessInPhase(phase.id, title, pos);
      setShowAddProcess(false);
      setAddProcessAtPosition(null);
      await onRefresh();
    });
  };

  const handleAddExistingProcess = (processId: string, position?: number) => {
    const pos = position ?? phase.processes.length;
    startTransition(async () => {
      await addProcessToPhase(phase.id, processId, pos);
      setShowAddProcess(false);
      setAddProcessAtPosition(null);
      await onRefresh();
    });
  };

  const handleRemoveProcess = (processId: string) => {
    startTransition(async () => {
      await removeProcessFromPhase(phase.id, processId);
      await onRefresh();
    });
  };

  const handleProcessDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = phase.processes.findIndex((p) => p.id === active.id);
    const newIndex = phase.processes.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(phase.processes, oldIndex, newIndex);
    const updates = reordered.map((p, i) => ({ phaseId: phase.id, processId: p.id, position: i }));
    startTransition(() => {
      reorderProcessesInPhase(updates).then(() => onRefresh());
    });
  };

  const filteredProcesses = localProcesses.filter((p) => filterByStatus(p.status));

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`border rounded-lg overflow-hidden bg-background ${statusColor}`}>
        {/* Phase header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b">
          <button
            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <span className="text-xs font-mono text-muted-foreground min-w-[60px]">Phase {phaseNumber}</span>

          {editingTitle ? (
            <Input
              autoFocus
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') { setTitleValue(phase.title); setEditingTitle(false); }
              }}
              className="h-7 text-sm font-semibold flex-1 max-w-xs"
            />
          ) : (
            <h3
              className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors flex-1 truncate"
              onClick={() => setEditingTitle(true)}
              title="Click to edit title"
            >
              {phase.title}
            </h3>
          )}

          <StatusBadge status={phase.status} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingTitle(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Title
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditingDesc(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Description
              </DropdownMenuItem>
              {(['Draft', 'In Review', 'Active', 'Needs Update', 'Archived'] as const).map((s) => (
                s !== phase.status && (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => {
                      startTransition(async () => {
                        await updatePhase(phase.id, { status: s });
                        await onRefresh();
                      });
                    }}
                  >
                    Set {s}
                  </DropdownMenuItem>
                )
              ))}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDeletePhase(phase.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Phase
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Phase description (editable) */}
        {editingDesc && (
          <div className="px-4 py-2 border-b bg-muted/10">
            <Textarea
              autoFocus
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={handleDescSave}
              placeholder="Phase description..."
              className="text-sm min-h-[60px]"
            />
          </div>
        )}
        {!editingDesc && phase.description && (
          <div
            className="px-4 py-2 border-b bg-muted/10 text-sm text-muted-foreground cursor-pointer hover:bg-muted/20"
            onClick={() => setEditingDesc(true)}
          >
            {phase.description}
          </div>
        )}

        {/* Processes within this phase */}
        {!collapsed && (
          <div className="p-3 space-y-3">
            <DndContext sensors={processSensors} collisionDetection={closestCenter} onDragEnd={handleProcessDragEnd}>
              <SortableContext items={filteredProcesses.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <DndContext
                  sensors={caSensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleCADragStart}
                  onDragOver={handleCADragOver}
                  onDragEnd={handleCADragEnd}
                >
                  {filteredProcesses.map((proc, procIndex) => (
                    <div key={proc.id}>
                      {/* "+" button above each process */}
                      {addProcessAtPosition === procIndex ? (
                        <AddProcessForm
                          onCreateNew={(title) => handleAddProcess(title, procIndex)}
                          onAddExisting={(id) => handleAddExistingProcess(id, procIndex)}
                          onCancel={() => setAddProcessAtPosition(null)}
                        />
                      ) : (
                        <div className="flex justify-center py-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[10px] text-muted-foreground/50 hover:text-primary opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                            onClick={() => setAddProcessAtPosition(procIndex)}
                          >
                            <Plus className="h-2.5 w-2.5 mr-0.5" />
                            Insert Process
                          </Button>
                        </div>
                      )}
                      <SortableProcess
                        process={proc}
                        processNumber={`${phaseNumber}.${procIndex + 1}`}
                        showPeople={showPeople}
                        showSoftware={showSoftware}
                        showRoles={showRoles}
                        filterByStatus={filterByStatus}
                        onPreview={onPreview}
                        onRemove={() => handleRemoveProcess(proc.id)}
                        onRefresh={onRefresh}
                        startTransition={startTransition}
                      />
                    </div>
                  ))}

                  <DragOverlay>
                    {activeDragCA ? (
                      <div className="bg-background rounded px-2 py-1.5 border shadow-lg opacity-90 w-[240px]">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getStatusDotColor(activeDragCA.status)}`} />
                          <span className="text-sm truncate">{activeDragCA.title}</span>
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </SortableContext>
            </DndContext>

            {filteredProcesses.length === 0 && !showAddProcess && addProcessAtPosition === null && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No processes in this phase.
              </p>
            )}

            {/* Add process at end */}
            {showAddProcess ? (
              <AddProcessForm
                onCreateNew={(title) => handleAddProcess(title)}
                onAddExisting={(id) => handleAddExistingProcess(id)}
                onCancel={() => setShowAddProcess(false)}
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-muted-foreground hover:text-primary"
                onClick={() => setShowAddProcess(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Process
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Sortable Process Component
function SortableProcess({
  process,
  processNumber,
  showPeople,
  showSoftware,
  showRoles,
  filterByStatus,
  onPreview,
  onRemove,
  onRefresh,
  startTransition,
}: {
  process: WorkflowMapProcess;
  processNumber: string;
  showPeople: boolean;
  showSoftware: boolean;
  showRoles: boolean;
  filterByStatus: (status: string) => boolean;
  onPreview: (state: { type: string; id: string }) => void;
  onRemove: () => void;
  onRefresh: () => Promise<void>;
  startTransition: React.TransitionStartFunction;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: process.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [showAddCA, setShowAddCA] = useState(false);
  const router = useRouter();

  const handleAddNewCA = (title: string) => {
    startTransition(async () => {
      await createCoreActivityInProcess(process.id, title, process.coreActivities.length);
      // Keep form open for adding next item (Enter = add next)
      await onRefresh();
    });
  };

  const handleAddExistingCA = (caId: string) => {
    startTransition(async () => {
      await addCoreActivityToProcess(process.id, caId, process.coreActivities.length);
      setShowAddCA(false);
      await onRefresh();
    });
  };

  const handleRemoveCA = (caId: string) => {
    startTransition(async () => {
      await removeCoreActivityFromProcess(process.id, caId);
      await onRefresh();
    });
  };

  const statusColor = getStatusBorderColor(process.status);
  const filteredCAs = process.coreActivities.filter((ca) => filterByStatus(ca.status));

  return (
    <div ref={setNodeRef} style={style} className={`border rounded-md overflow-hidden ${statusColor}`}>
      {/* Process header */}
      <div className="group flex items-center gap-2 px-3 py-2 bg-muted/20 border-b">
        <button
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <span className="text-xs font-mono text-muted-foreground">{processNumber}</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="text-sm font-medium flex-1 truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => router.push(`/processes/${process.id}`)}
            >
              {process.title}
            </span>
          </TooltipTrigger>
          {process.description && (
            <TooltipContent side="top" className="max-w-[300px]">
              <p className="text-xs">{process.description}</p>
            </TooltipContent>
          )}
        </Tooltip>

        <StatusBadge status={process.status} />

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onPreview({ type: 'process', id: process.id })}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Core Activities within this process */}
      <div className="p-2 space-y-1">
        <SortableContext items={filteredCAs.map((ca) => ca.id)} strategy={verticalListSortingStrategy}>
          {filteredCAs.map((ca) => (
            <SortableCoreActivity
              key={ca.id}
              coreActivity={ca}
              showPeople={showPeople}
              showSoftware={showSoftware}
              showRoles={showRoles}
              onPreview={() => onPreview({ type: 'core_activity', id: ca.id })}
              onRemove={() => handleRemoveCA(ca.id)}
            />
          ))}
        </SortableContext>

        {/* Add Core Activity */}
        {showAddCA ? (
          <AddCoreActivityForm
            onCreateNew={handleAddNewCA}
            onAddExisting={handleAddExistingCA}
            onCancel={() => setShowAddCA(false)}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground hover:text-primary"
            onClick={() => setShowAddCA(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Activity
          </Button>
        )}
      </div>
    </div>
  );
}

// Sortable Core Activity Card
function SortableCoreActivity({
  coreActivity,
  showPeople,
  showSoftware,
  showRoles,
  onPreview,
  onRemove,
}: {
  coreActivity: WorkflowMapCoreActivity;
  showPeople: boolean;
  showSoftware: boolean;
  showRoles: boolean;
  onPreview: () => void;
  onRemove: () => void;
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

  const router = useRouter();
  const statusDot = getStatusDotColor(coreActivity.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      tabIndex={0}
      className="group flex items-start gap-2 px-2 py-1.5 rounded hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors cursor-pointer"
      onClick={onPreview}
      onKeyDown={(e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          onRemove();
        }
      }}
    >
      <button
        className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </button>

      <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${statusDot}`} title={coreActivity.status} />

      <div className="flex-1 min-w-0">
        <span
          className="text-sm hover:text-primary hover:underline cursor-pointer transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/core-activities/${coreActivity.id}`);
          }}
        >
          {coreActivity.title}
        </span>

        {/* People */}
        {showPeople && coreActivity.people.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {coreActivity.people.slice(0, 3).map((p) => (
              <span key={p.id} className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[9px] font-medium" title={`${p.first_name} ${p.last_name}`}>
                {p.first_name[0]}{p.last_name[0]}
              </span>
            ))}
            {coreActivity.people.length > 3 && (
              <span className="text-[9px] text-muted-foreground">+{coreActivity.people.length - 3}</span>
            )}
          </div>
        )}

        {/* Software */}
        {showSoftware && coreActivity.software.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {coreActivity.software.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-0.5 text-[9px] bg-[#d6e5f5] text-[#0b2d5d] px-1 py-0.5 rounded" title={s.title}>
                <Monitor className="h-2.5 w-2.5" />
                {s.title.length > 10 ? s.title.slice(0, 10) + '...' : s.title}
              </span>
            ))}
          </div>
        )}

        {/* Roles */}
        {showRoles && coreActivity.roles.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {coreActivity.roles.map((r) => (
              <span key={r.id} className="inline-flex items-center gap-0.5 text-[9px] bg-[#e8dff5] text-[#4a2d82] px-1 py-0.5 rounded">
                <Shield className="h-2.5 w-2.5" />
                {r.title.length > 12 ? r.title.slice(0, 12) + '...' : r.title}
              </span>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Add Process Form
function AddProcessForm({
  onCreateNew,
  onAddExisting,
  onCancel,
}: {
  onCreateNew: (title: string) => void;
  onAddExisting: (id: string) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<{ id: string; label: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await searchRecords('process', q, 10);
    if (res.success) setResults(res.data);
    setSearching(false);
  };

  return (
    <div className="border rounded-md p-3 bg-muted/10 space-y-2">
      <div className="flex items-center gap-2">
        <Button variant={mode === 'new' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setMode('new')}>
          Create New
        </Button>
        <Button variant={mode === 'existing' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setMode('existing')}>
          Add Existing
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {mode === 'new' ? (
        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="Process title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && title.trim()) onCreateNew(title.trim());
              if (e.key === 'Tab') {
                e.preventDefault();
                if (title.trim()) onCreateNew(title.trim());
                onCancel();
              }
              if (e.key === 'Escape') onCancel();
            }}
            className="h-8 text-sm"
          />
          <Button size="sm" className="h-8" onClick={() => title.trim() && onCreateNew(title.trim())} disabled={!title.trim()}>
            Create
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search processes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
              className="h-8 text-sm pl-7"
            />
          </div>
          {results.length > 0 && (
            <div className="border rounded max-h-[150px] overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors"
                  onClick={() => onAddExisting(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
          {searchQuery && !searching && results.length === 0 && (
            <p className="text-xs text-muted-foreground px-1">No processes found.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Add Core Activity Form
function AddCoreActivityForm({
  onCreateNew,
  onAddExisting,
  onCancel,
}: {
  onCreateNew: (title: string) => void;
  onAddExisting: (id: string) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<{ id: string; label: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await searchRecords('core_activity', q, 10);
    if (res.success) setResults(res.data);
    setSearching(false);
  };

  return (
    <div className="border rounded p-2 bg-muted/10 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Button variant={mode === 'new' ? 'default' : 'outline'} size="sm" className="h-6 text-[10px] px-2" onClick={() => setMode('new')}>
          New
        </Button>
        <Button variant={mode === 'existing' ? 'default' : 'outline'} size="sm" className="h-6 text-[10px] px-2" onClick={() => setMode('existing')}>
          Existing
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 ml-auto" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {mode === 'new' ? (
        <Input
          autoFocus
          placeholder="Activity title (start with action verb) — Enter to add"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) {
              onCreateNew(title.trim());
              setTitle(''); // Clear for next item
            }
            if (e.key === 'Tab') {
              e.preventDefault();
              if (title.trim()) onCreateNew(title.trim());
              onCancel(); // Close form and move on
            }
            if (e.key === 'Escape') onCancel();
          }}
          className="h-7 text-xs"
        />
      ) : (
        <div className="space-y-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
              className="h-7 text-xs pl-6"
            />
          </div>
          {results.length > 0 && (
            <div className="border rounded max-h-[120px] overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-muted/50 transition-colors"
                  onClick={() => onAddExisting(r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
          {searchQuery && !searching && results.length === 0 && (
            <p className="text-[10px] text-muted-foreground">No activities found.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Handoff Block Component
function HandoffBlock({
  handoff,
  onUpdate,
  onDelete,
}: {
  handoff: { id: string; label: string };
  onUpdate: (label: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(handoff.label);

  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4">
      <div className="flex-1 h-px bg-border" />
      <div className="group flex items-center gap-2 px-3 py-1.5 bg-[#fef3cd] border border-[#e8d5a0] rounded-full text-[#856404]">
        <ArrowRightLeft className="h-3.5 w-3.5 flex-shrink-0" />
        {editing ? (
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
              if (value.trim() && value !== handoff.label) onUpdate(value.trim());
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (value.trim() && value !== handoff.label) onUpdate(value.trim());
                setEditing(false);
              }
              if (e.key === 'Escape') { setValue(handoff.label); setEditing(false); }
            }}
            className="h-6 text-xs bg-transparent border-none p-0 min-w-[200px]"
          />
        ) : (
          <span
            className="text-xs font-medium cursor-pointer hover:underline"
            onClick={() => setEditing(true)}
          >
            {handoff.label}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#856404] hover:text-[#891a1a]"
          onClick={onDelete}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// Helper: status border color for the left stripe
function getStatusBorderColor(status: string): string {
  switch (status) {
    case 'Draft': return 'border-l-4 border-l-[#9e9c9a]';
    case 'In Review': return 'border-l-4 border-l-[#856404]';
    case 'Active': return 'border-l-4 border-l-[#155724]';
    case 'Needs Update': return 'border-l-4 border-l-[#984c0c]';
    case 'Archived': return 'border-l-4 border-l-[#891a1a]';
    default: return 'border-l-4 border-l-[#c5c3c1]';
  }
}

// Helper: status dot color
function getStatusDotColor(status: string): string {
  switch (status) {
    case 'Draft': return 'bg-[#9e9c9a]';
    case 'In Review': return 'bg-[#856404]';
    case 'Active': return 'bg-[#155724]';
    case 'Needs Update': return 'bg-[#984c0c]';
    case 'Archived': return 'bg-[#891a1a]';
    default: return 'bg-[#c5c3c1]';
  }
}
