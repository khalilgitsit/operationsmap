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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { StatusBadge } from '@/components/status-badge';
import { PreviewPanel } from '@/components/preview-panel';
import { QuickCreatePanel } from '@/components/quick-create-panel';
import { ReferenceCombobox } from '@/components/reference-combobox';
import { PageHeader } from '@/components/page-header';
import { getObjectConfig } from '@/lib/object-config';
import {
  getFunctionChartData,
  reorderSubfunctions,
  addSubfunctionAssociation,
  type FunctionChartFunction,
  type FunctionChartSubfunction,
} from '@/server/actions/function-chart';
import { Plus, GripVertical, Users, Monitor, Shield, Tag, Download, Copy, FileDown, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getFunctionChartExportData } from '@/server/actions/export';
import { exportFunctionChart, downloadMarkdown, copyToClipboard } from '@/lib/markdown-export';
import { MarkdownImportDialog } from '@/components/markdown-import-dialog';

type SortMode = 'custom' | 'az' | 'za';

export default function FunctionChartPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [functions, setFunctions] = useState<FunctionChartFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('custom');

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

  // Panels
  const [previewState, setPreviewState] = useState<{ type: string; id: string } | null>(null);
  const [createState, setCreateState] = useState<{
    type: string;
    defaults?: Record<string, unknown>;
  } | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getFunctionChartData();
    if (result.success) {
      setFunctions(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Persist toggle state
  useEffect(() => {
    localStorage.setItem('fc-show-people', String(showPeople));
  }, [showPeople]);
  useEffect(() => {
    localStorage.setItem('fc-show-software', String(showSoftware));
  }, [showSoftware]);
  useEffect(() => {
    localStorage.setItem('fc-show-roles', String(showRoles));
  }, [showRoles]);

  const sortedFunctions = [...functions].sort((a, b) => {
    if (sortMode === 'az') return a.title.localeCompare(b.title);
    if (sortMode === 'za') return b.title.localeCompare(a.title);
    return 0; // custom = insertion order
  });

  const handleSubfunctionDragEnd = (functionId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFunctions((prev) =>
      prev.map((fn) => {
        if (fn.id !== functionId) return fn;
        const oldIndex = fn.subfunctions.findIndex((sf) => sf.id === active.id);
        const newIndex = fn.subfunctions.findIndex((sf) => sf.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return fn;
        const reordered = arrayMove(fn.subfunctions, oldIndex, newIndex);
        const updates = reordered.map((sf, i) => ({ id: sf.id, position: i }));
        startTransition(() => { reorderSubfunctions(updates); });
        return { ...fn, subfunctions: reordered };
      })
    );
  };

  const handleAddAssociation = async (
    subfunctionId: string,
    targetType: 'person' | 'role' | 'software',
    targetId: string
  ) => {
    startTransition(async () => {
      await addSubfunctionAssociation(subfunctionId, targetType, targetId);
      await fetchData();
    });
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Function Chart" />
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        <PageHeader title="Function Chart" />

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom Order</SelectItem>
              <SelectItem value="az">Alphabetical A-Z</SelectItem>
              <SelectItem value="za">Alphabetical Z-A</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 ml-2">
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
                      const result = await getFunctionChartExportData();
                      if (result.success) {
                        const md = exportFunctionChart(result.data);
                        downloadMarkdown(md, 'function-chart.md');
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
                      const result = await getFunctionChartExportData();
                      if (result.success) {
                        const md = exportFunctionChart(result.data);
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

        {/* Function columns */}
        <div className="flex gap-4 overflow-x-auto pb-6 min-h-[400px]">
          {sortedFunctions.map((fn) => (
            <div
              key={fn.id}
              className="flex-shrink-0 w-[280px] bg-muted/30 rounded-lg border"
            >
              {/* Function header */}
              <div className="p-3 border-b bg-muted/50 rounded-t-lg">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3
                      className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors truncate"
                      onClick={() => router.push(`/function-chart/${fn.id}`)}
                    >
                      {fn.title}
                    </h3>
                  </TooltipTrigger>
                  {fn.description && (
                    <TooltipContent side="bottom" className="max-w-[300px]">
                      <p className="text-xs">{fn.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <button
                  className="text-xs text-muted-foreground hover:text-primary hover:underline mt-0.5"
                  onClick={() => router.push(`/functions/${fn.id}`)}
                >
                  View record
                </button>
              </div>

              {/* Add subfunction at top */}
              <div className="px-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-muted-foreground hover:text-primary"
                  onClick={() =>
                    setCreateState({
                      type: 'subfunction',
                      defaults: { function_id: fn.id },
                    })
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Subfunction
                </Button>
              </div>

              {/* Subfunction cards */}
              <div className="p-2 space-y-2 min-h-[100px]">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSubfunctionDragEnd(fn.id)}
                >
                  <SortableContext
                    items={fn.subfunctions.map((sf) => sf.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {fn.subfunctions.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        No subfunctions yet
                      </p>
                    ) : (
                      fn.subfunctions.map((sf) => (
                        <SortableSubfunctionCard
                          key={sf.id}
                          subfunction={sf}
                          showPeople={showPeople}
                          showSoftware={showSoftware}
                          showRoles={showRoles}
                          onPreview={() => setPreviewState({ type: 'subfunction', id: sf.id })}
                          onAddAssociation={handleAddAssociation}
                        />
                      ))
                    )}
                  </SortableContext>
                </DndContext>
              </div>

              {/* Add subfunction at bottom */}
              <div className="px-2 pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-muted-foreground hover:text-primary"
                  onClick={() =>
                    setCreateState({
                      type: 'subfunction',
                      defaults: { function_id: fn.id },
                    })
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Subfunction
                </Button>
              </div>
            </div>
          ))}

          {/* Add new Function column */}
          <div className="flex-shrink-0 w-[280px] flex items-start justify-center pt-16">
            <Button
              variant="outline"
              className="h-auto py-8 px-6 flex flex-col gap-2"
              onClick={() => setCreateState({ type: 'function' })}
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm">Add Function</span>
            </Button>
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

        {/* Markdown Import Dialog */}
        <MarkdownImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          importType="function_chart"
          onImported={fetchData}
        />
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

function SortableSubfunctionCard({
  subfunction,
  showPeople,
  showSoftware,
  showRoles,
  onPreview,
  onAddAssociation,
}: {
  subfunction: FunctionChartSubfunction;
  showPeople: boolean;
  showSoftware: boolean;
  showRoles: boolean;
  onPreview: () => void;
  onAddAssociation: (subfunctionId: string, targetType: 'person' | 'role' | 'software', targetId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subfunction.id });

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
          className="group bg-background rounded-md border p-3 cursor-pointer hover:border-primary/50 transition-colors relative"
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
                <span className="text-sm font-medium truncate">{subfunction.title}</span>
                <StatusBadge status={subfunction.status} />
              </div>

              {/* People avatars */}
              {showPeople && subfunction.people.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {subfunction.people.slice(0, 5).map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-medium"
                      title={`${p.first_name} ${p.last_name}`}
                    >
                      {p.first_name[0]}{p.last_name[0]}
                    </span>
                  ))}
                  {subfunction.people.length > 5 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{subfunction.people.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Software icons */}
              {showSoftware && subfunction.software.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {subfunction.software.map((s) => (
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
              {showRoles && subfunction.roles.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {subfunction.roles.map((r) => (
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

            {/* Inline tagging button */}
            <InlineTaggingButton
              subfunctionId={subfunction.id}
              onAddAssociation={onAddAssociation}
            />
          </div>
        </div>
      </TooltipTrigger>
      {subfunction.description && (
        <TooltipContent side="right" className="max-w-[300px]">
          <p className="text-xs">{subfunction.description}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
}

function InlineTaggingButton({
  subfunctionId,
  onAddAssociation,
}: {
  subfunctionId: string;
  onAddAssociation: (subfunctionId: string, targetType: 'person' | 'role' | 'software', targetId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tagType, setTagType] = useState<'person' | 'role' | 'software'>('person');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-1 rounded"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Tag className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-3"
        onClick={(e) => e.stopPropagation()}
        align="end"
      >
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Add Association</h4>
          <Select value={tagType} onValueChange={(v) => setTagType(v as typeof tagType)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="person">Person</SelectItem>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="software">Software</SelectItem>
            </SelectContent>
          </Select>
          <ReferenceCombobox
            referenceType={tagType}
            value={null}
            onChange={(id) => {
              if (id) {
                onAddAssociation(subfunctionId, tagType, id);
                setOpen(false);
              }
            }}
            placeholder={`Search ${tagType}...`}
            className="h-8"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
