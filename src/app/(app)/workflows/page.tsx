'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/status-badge';
import { Plus, Search, ArrowUpDown, MoreHorizontal, Trash2, Upload } from 'lucide-react';
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
import { listWorkflows, createWorkflow, deleteWorkflow } from '@/server/actions/workflow';
import { ImportDialog } from '@/components/import-dialog';

interface WorkflowItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  phase_count: number;
  process_count: number;
  core_activity_count: number;
}

type SortField = 'title' | 'status' | 'updated_at' | 'phase_count' | 'process_count' | 'core_activity_count';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'Draft' | 'Active' | 'Archived';

export default function WorkflowsPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await listWorkflows();
    if (result.success) {
      setWorkflows(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'title' || field === 'status' ? 'asc' : 'desc');
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const result = await createWorkflow(newTitle.trim());
      if (result.success) {
        router.push(`/workflows/${result.data.id}`);
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteWorkflow(deleteId);
      setDeleteId(null);
      await fetchData();
    });
  };

  const filtered = workflows
    .filter((w) => {
      if (search && !w.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

  return (
    <div>
      <PageHeader title="All Workflows" />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Create dialog */}
      {creating && (
        <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3 max-w-lg">
          <h3 className="text-sm font-semibold">Create New Workflow</h3>
          <div className="space-y-2">
            <Input
              autoFocus
              placeholder="Workflow title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setCreating(false);
                  setNewTitle('');
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={isPending || !newTitle.trim()}>
              Create
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setNewTitle('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-4">No workflows yet. Create your first workflow to get started.</p>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <SortableHeader field="title" label="Title" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="w-[120px]" />
                <SortableHeader field="phase_count" label="Phases" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="w-[100px]" />
                <SortableHeader field="process_count" label="Processes" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="w-[100px]" />
                <SortableHeader field="core_activity_count" label="Core Activities" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="w-[130px]" />
                <SortableHeader field="updated_at" label="Last Modified" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="w-[150px]" />
                <th className="w-[50px]" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((wf) => (
                <tr
                  key={wf.id}
                  className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/workflows/${wf.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{wf.title}</span>
                      <StatusBadge status={wf.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={wf.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{wf.phase_count}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{wf.process_count}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{wf.core_activity_count}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(wf.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(wf.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No workflows match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this workflow and all its phases. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
  );
}

function SortableHeader({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = sortField === field;
  return (
    <th className={`px-4 py-2 text-left ${className || ''}`}>
      <button
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => onSort(field)}
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'text-foreground' : ''} ${isActive && sortDir === 'asc' ? 'rotate-180' : ''} transition-transform`} />
      </button>
    </th>
  );
}
