'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Plus, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChecklistItem {
  id: string;
  text: string;
  position: number;
}

interface ChecklistItemsEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

const SOFT_LIMIT = 10;

function generateId(): string {
  return crypto.randomUUID();
}

function SortableChecklistItem({
  item,
  index,
  onTextChange,
  onDelete,
  onPaste,
  onKeyDown,
  inputRef,
}: {
  item: ChecklistItem;
  index: number;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onPaste: (id: string, e: React.ClipboardEvent<HTMLInputElement>) => void;
  onKeyDown: (id: string, e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: (el: HTMLInputElement | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 group',
        isDragging && 'opacity-50 z-50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none shrink-0"
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <span className="text-sm text-muted-foreground w-6 text-right shrink-0 tabular-nums">
        {index + 1}.
      </span>
      <Input
        ref={inputRef}
        className="h-8 text-sm flex-1"
        value={item.text}
        onChange={(e) => onTextChange(item.id, e.target.value)}
        onPaste={(e) => onPaste(item.id, e as React.ClipboardEvent<HTMLInputElement>)}
        onKeyDown={(e) => onKeyDown(item.id, e as React.KeyboardEvent<HTMLInputElement>)}
        placeholder={`Item ${index + 1}`}
      />
      <button
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
        onClick={() => onDelete(item.id)}
        tabIndex={-1}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ChecklistItemsEditor({ items, onChange }: ChecklistItemsEditorProps) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (focusId) {
      const el = inputRefs.current.get(focusId);
      if (el) {
        el.focus();
        setFocusId(null);
      }
    }
  }, [focusId, items]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      position: idx,
    }));
    onChange(reordered);
  }, [items, onChange]);

  const handleTextChange = useCallback((id: string, text: string) => {
    onChange(items.map((item) => (item.id === id ? { ...item, text } : item)));
  }, [items, onChange]);

  const handleDelete = useCallback((id: string) => {
    const updated = items
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, position: idx }));
    onChange(updated);
  }, [items, onChange]);

  const handleAdd = useCallback(() => {
    const newItem: ChecklistItem = {
      id: generateId(),
      text: '',
      position: items.length,
    };
    onChange([...items, newItem]);
    setFocusId(newItem.id);
  }, [items, onChange]);

  const handlePaste = useCallback((id: string, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text/plain');
    const lines = pastedText.split(/\r?\n/).filter((line) => line.trim() !== '');

    if (lines.length <= 1) return; // Let normal paste handle single line

    e.preventDefault();

    const itemIndex = items.findIndex((i) => i.id === id);
    if (itemIndex === -1) return;

    // Replace current item with first line, insert rest after
    const newItems: ChecklistItem[] = [];
    for (let i = 0; i < items.length; i++) {
      if (i === itemIndex) {
        // Replace current with first pasted line
        newItems.push({ ...items[i], text: lines[0] });
        // Add remaining lines as new items
        for (let j = 1; j < lines.length; j++) {
          newItems.push({
            id: generateId(),
            text: lines[j],
            position: 0,
          });
        }
      } else {
        newItems.push(items[i]);
      }
    }
    onChange(newItems.map((item, idx) => ({ ...item, position: idx })));
  }, [items, onChange]);

  const handleKeyDown = useCallback((id: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const idx = items.findIndex((i) => i.id === id);
      const newItem: ChecklistItem = {
        id: generateId(),
        text: '',
        position: idx + 1,
      };
      const newItems = [...items];
      newItems.splice(idx + 1, 0, newItem);
      onChange(newItems.map((item, i) => ({ ...item, position: i })));
      setFocusId(newItem.id);
    } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
      e.preventDefault();
      if (items.length <= 1) return;
      const idx = items.findIndex((i) => i.id === id);
      const prevId = idx > 0 ? items[idx - 1].id : items.length > 1 ? items[1].id : null;
      handleDelete(id);
      if (prevId) setFocusId(prevId);
    }
  }, [items, onChange, handleDelete]);

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {items.map((item, index) => (
              <SortableChecklistItem
                key={item.id}
                item={item}
                index={index}
                onTextChange={handleTextChange}
                onDelete={handleDelete}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                inputRef={(el) => {
                  if (el) inputRefs.current.set(item.id, el);
                  else inputRefs.current.delete(item.id);
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length > SOFT_LIMIT && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-md px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Checklists are recommended to be no longer than {SOFT_LIMIT} items.</span>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={handleAdd}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add item
      </Button>
    </div>
  );
}
