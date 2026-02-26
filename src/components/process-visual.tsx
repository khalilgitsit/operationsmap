'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/status-badge';
import { ArrowRight, GripVertical, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  getProcessWorkflowContext,
  createCoreActivityInProcess,
  reorderCoreActivitiesInProcess,
  type ProcessWorkflowContext,
} from '@/server/actions/workflow';

interface ProcessVisualProps {
  processId: string;
  onRefresh?: () => void;
}

export function ProcessVisual({ processId, onRefresh }: ProcessVisualProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [context, setContext] = useState<ProcessWorkflowContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchContext = useCallback(async () => {
    setLoading(true);
    const result = await getProcessWorkflowContext(processId);
    if (result.success) {
      setContext(result.data);
    }
    setLoading(false);
  }, [processId]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !context) return;

    const oldIndex = context.coreActivities.findIndex((ca) => ca.id === active.id);
    const newIndex = context.coreActivities.findIndex((ca) => ca.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(context.coreActivities, oldIndex, newIndex);
    // Update numbers
    const phaseNum = context.phasePosition + 1;
    const processNum = context.processPosition + 1;
    const updatedCAs = reordered.map((ca, i) => ({
      ...ca,
      position: i,
      number: `${phaseNum}.${processNum}.${i + 1}`,
    }));

    setContext({ ...context, coreActivities: updatedCAs });

    const updates = updatedCAs.map((ca) => ({
      processId,
      coreActivityId: ca.id,
      position: ca.position,
    }));

    startTransition(async () => {
      const result = await reorderCoreActivitiesInProcess(updates);
      if (result.success) {
        toast.success('Reordered');
        onRefresh?.();
      } else {
        toast.error('Failed to reorder');
        fetchContext();
      }
    });
  };

  const handleAddCA = () => {
    if (!newTitle.trim()) return;
    const title = newTitle.trim();
    setNewTitle('');

    startTransition(async () => {
      const position = context?.coreActivities.length ?? 0;
      const result = await createCoreActivityInProcess(processId, title, position);
      if (result.success) {
        toast.success('Core activity created');
        fetchContext();
        onRefresh?.();
      } else {
        toast.error(result.error || 'Failed to create');
      }
    });
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="h-4 w-32 bg-muted animate-pulse rounded mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-28 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="border rounded-lg p-4 bg-muted/20 text-center">
        <p className="text-sm text-muted-foreground">
          This process is not part of a workflow yet.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Process Flow
          <span className="ml-2 text-xs">
            ({context.workflowTitle})
          </span>
        </h3>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={context.coreActivities.map((ca) => ca.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-1.5 items-center">
            {context.coreActivities.map((ca, idx) => (
              <div key={ca.id} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <SortableCANode
                  ca={ca}
                  onClick={() => router.push(`/core-activities/${ca.id}`)}
                />
              </div>
            ))}

            {/* Add button */}
            {adding ? (
              <div className="flex items-center gap-1 ml-1">
                {context.coreActivities.length > 0 && (
                  <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <Input
                  autoFocus
                  placeholder="CA title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCA();
                    if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
                  }}
                  onBlur={() => {
                    if (!newTitle.trim()) setAdding(false);
                  }}
                  className="h-8 w-40 text-xs"
                  disabled={isPending}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 ml-1"
                onClick={() => setAdding(true)}
                title="Add core activity"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {context.coreActivities.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground mt-2">
          No core activities yet. Click + to add one.
        </p>
      )}
    </div>
  );
}

function SortableCANode({
  ca,
  onClick,
}: {
  ca: { id: string; title: string; status: string; number: string };
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ca.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 bg-background
        hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer
        ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary/20' : ''}
      `}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing shrink-0 text-muted-foreground hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button onClick={onClick} className="flex items-center gap-1.5 min-w-0">
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
          {ca.number}
        </span>
        <span className="text-xs font-medium truncate max-w-[120px]" title={ca.title}>
          {ca.title}
        </span>
      </button>
    </div>
  );
}
