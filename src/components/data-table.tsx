'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { ReferenceCombobox } from '@/components/reference-combobox';
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Search, Columns3, X } from 'lucide-react';
import { type ColumnConfig, type ObjectConfig, getRecordTitle } from '@/lib/object-config';
import { listRecords, updateRecord, searchRecords } from '@/server/actions/generic';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DataTableProps {
  config: ObjectConfig;
  onCreateNew?: () => void;
  onRowClick?: (record: Record<string, unknown>) => void;
  /** Pre-applied filter (e.g., from URL params) */
  initialFilters?: Record<string, string>;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export function DataTable({ config, onCreateNew, onRowClick, initialFilters }: DataTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ field: 'created_at', direction: 'desc' });
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters || {});
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const visible = new Set<string>();
    config.columns.forEach((col) => {
      if (col.visible !== false) visible.add(col.key);
    });
    return visible;
  });
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<unknown>(null);
  const [referenceLabels, setReferenceLabels] = useState<Record<string, Record<string, string>>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  const searchFields = useMemo(
    () => config.columns.filter((c) => c.type === 'text' || c.type === 'email').map((c) => c.key),
    [config.columns]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const result = await listRecords(config.type, {
        sortField: sort.field,
        sortDirection: sort.direction,
        filters,
        search,
        searchFields,
      });
      if (result.success) {
        setData(result.data.items);
        setTotalCount(result.data.totalCount);
      } else {
        setFetchError(result.error);
      }
    } catch {
      // Server action failed — show empty state rather than infinite skeletons
    }
    setLoading(false);
  }, [config.type, sort, filters, search, searchFields]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  // Pre-fetch reference labels for displayed data
  const refColumns = useMemo(
    () => config.columns.filter((c) => c.type === 'reference' && c.referenceType),
    [config.columns]
  );

  useEffect(() => {
    if (data.length === 0 || refColumns.length === 0) return;

    for (const col of refColumns) {
      const ids = [...new Set(
        data.map((row) => row[col.key]).filter((v): v is string => typeof v === 'string')
      )];
      if (ids.length === 0) continue;
      // Skip IDs we already have labels for
      const missing = ids.filter((id) => !referenceLabels[col.key]?.[id]);
      if (missing.length === 0) continue;

      // Fetch labels via searchRecords (returns {id, label} pairs)
      searchRecords(col.referenceType!, '', 100).then((result) => {
        if (result.success) {
          const labelMap: Record<string, string> = {};
          for (const item of result.data) {
            if (ids.includes(item.id)) {
              labelMap[item.id] = item.label;
            }
          }
          if (Object.keys(labelMap).length > 0) {
            setReferenceLabels((prev) => ({
              ...prev,
              [col.key]: { ...prev[col.key], ...labelMap },
            }));
          }
        }
      });
    }
  }, [data, refColumns]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (field: string) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleInlineEdit = async (rowId: string, colKey: string, value: unknown) => {
    startTransition(async () => {
      const result = await updateRecord(config.type, rowId, { [colKey]: value });
      if (result.success) {
        setData((prev) =>
          prev.map((row) => (row.id === rowId ? { ...row, [colKey]: value } : row))
        );
      } else {
        toast.error(result.error);
      }
      setEditingCell(null);
    });
  };

  const handleRowClick = (record: Record<string, unknown>) => {
    if (onRowClick) {
      onRowClick(record);
    } else {
      router.push(config.recordHref(record.id as string));
    }
  };

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => {
      if (!value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  const activeFilterCount = Object.keys(filters).length;
  const filteredCount = data.length;

  const displayColumns = config.columns.filter((col) => visibleColumns.has(col.key));

  const renderCellContent = (col: ColumnConfig, row: Record<string, unknown>) => {
    const value = row[col.key];
    const isEditing = editingCell?.rowId === (row.id as string) && editingCell?.colKey === col.key;

    // Inline editing
    if (isEditing && col.editable) {
      return renderEditableCell(col, row);
    }

    switch (col.type) {
      case 'select':
        if (col.key === config.statusField) {
          return (
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (col.editable) {
                  setEditingCell({ rowId: row.id as string, colKey: col.key });
                  setEditValue(value);
                }
              }}
            >
              <StatusBadge status={(value as string) || ''} />
            </div>
          );
        }
        return (
          <span
            className={cn(col.editable && 'cursor-pointer hover:text-primary')}
            onClick={(e) => {
              e.stopPropagation();
              if (col.editable) {
                setEditingCell({ rowId: row.id as string, colKey: col.key });
                setEditValue(value);
              }
            }}
          >
            {(value as string) || '—'}
          </span>
        );

      case 'reference': {
        const refId = value as string | null;
        if (!refId) return <span className="text-muted-foreground">—</span>;
        const label = referenceLabels[col.key]?.[refId];
        return (
          <span
            className={cn(col.editable && 'cursor-pointer hover:text-primary')}
            onClick={(e) => {
              e.stopPropagation();
              if (col.editable) {
                setEditingCell({ rowId: row.id as string, colKey: col.key });
                setEditValue(value);
              }
            }}
          >
            {label || <span className="text-muted-foreground italic">Loading…</span>}
          </span>
        );
      }

      case 'date':
        return value ? new Date(value as string).toLocaleDateString() : '—';

      case 'currency':
        return value != null ? `$${Number(value).toLocaleString()}` : '—';

      case 'email':
        return value ? (
          <a href={`mailto:${value}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
            {value as string}
          </a>
        ) : '—';

      case 'url':
        return value ? (
          <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
            Link
          </a>
        ) : '—';

      case 'multi_select':
        return Array.isArray(value) && value.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {(value as string[]).map((v) => (
              <span key={v} className="rounded bg-muted px-1.5 py-0.5 text-xs">{v}</span>
            ))}
          </div>
        ) : '—';

      default:
        return (
          <span
            className={cn(col.editable && 'cursor-pointer hover:text-primary')}
            onClick={(e) => {
              e.stopPropagation();
              if (col.editable) {
                setEditingCell({ rowId: row.id as string, colKey: col.key });
                setEditValue(value ?? '');
              }
            }}
          >
            {(value as string) || '—'}
          </span>
        );
    }
  };

  const renderEditableCell = (col: ColumnConfig, row: Record<string, unknown>) => {
    switch (col.type) {
      case 'select':
        return (
          <Select
            value={(editValue as string) || ''}
            onValueChange={(v) => {
              handleInlineEdit(row.id as string, col.key, v);
            }}
            open
            onOpenChange={(open) => {
              if (!open) setEditingCell(null);
            }}
          >
            <SelectTrigger className="h-8 w-[140px]" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {col.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'reference':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <ReferenceCombobox
              referenceType={col.referenceType!}
              value={(editValue as string) || null}
              onChange={(id, label) => {
                handleInlineEdit(row.id as string, col.key, id);
                if (id && label) {
                  setReferenceLabels((prev) => ({
                    ...prev,
                    [col.key]: { ...prev[col.key], [id]: label },
                  }));
                }
              }}
              className="h-8"
            />
          </div>
        );

      case 'currency':
      case 'number':
        return (
          <Input
            type="number"
            autoFocus
            className="h-8 w-[120px]"
            defaultValue={editValue as number || ''}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => handleInlineEdit(row.id as string, col.key, e.target.value ? Number(e.target.value) : null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInlineEdit(row.id as string, col.key, (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null);
              }
              if (e.key === 'Escape') setEditingCell(null);
            }}
          />
        );

      default:
        return (
          <Input
            type={col.type === 'email' ? 'email' : 'text'}
            autoFocus
            className="h-8 w-full"
            defaultValue={(editValue as string) || ''}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => handleInlineEdit(row.id as string, col.key, e.target.value || null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInlineEdit(row.id as string, col.key, (e.target as HTMLInputElement).value || null);
              }
              if (e.key === 'Escape') setEditingCell(null);
            }}
          />
        );
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sort.field !== field) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sort.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${config.labelPlural.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        {config.columns
          .filter((col) => col.filterable && col.type === 'select' && col.options)
          .map((col) => (
            <Select
              key={col.key}
              value={filters[col.key] || '_all'}
              onValueChange={(v) => setFilter(col.key, v === '_all' ? '' : v)}
            >
              <SelectTrigger className="w-auto min-w-[150px]">
                <SelectValue placeholder={col.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All {col.label}</SelectItem>
                {col.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
            <X className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        )}

        {/* Column picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="mr-1 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {config.columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={visibleColumns.has(col.key)}
                onCheckedChange={(checked) => {
                  setVisibleColumns((prev) => {
                    const next = new Set(prev);
                    if (checked) next.add(col.key);
                    else next.delete(col.key);
                    return next;
                  });
                }}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={onCreateNew} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Create New
        </Button>
      </div>

      {/* Count */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          {activeFilterCount > 0
            ? `${filteredCount} of ${totalCount} ${config.labelPlural}`
            : `${totalCount} ${config.labelPlural}`}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {displayColumns.map((col) => (
                <TableHead key={col.key} className={col.width ? `w-[${col.width}]` : undefined}>
                  {col.sortable ? (
                    <button
                      className="flex items-center hover:text-foreground -ml-2 px-2 py-1 rounded"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label}
                      <SortIcon field={col.key} />
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {displayColumns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : fetchError ? (
              <TableRow>
                <TableCell colSpan={displayColumns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-destructive text-sm">{fetchError}</p>
                    <Button size="sm" variant="outline" onClick={fetchData}>
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={displayColumns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">
                      No {config.labelPlural.toLowerCase()} found.
                      {search || activeFilterCount > 0
                        ? ' Try adjusting your search or filters.'
                        : ' Create your first one.'}
                    </p>
                    {!search && activeFilterCount === 0 && (
                      <Button size="sm" onClick={onCreateNew}>
                        <Plus className="mr-1 h-4 w-4" />
                        Create {config.label}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.id as string}
                  className={cn('cursor-pointer hover:bg-muted/50', isPending && 'opacity-50')}
                  role="link"
                  tabIndex={0}
                  onClick={() => handleRowClick(row)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(row);
                    }
                  }}
                >
                  {displayColumns.map((col, colIndex) => (
                    <TableCell key={col.key}>
                      {colIndex === 0 ? (
                        <Link
                          href={config.recordHref(row.id as string)}
                          className="font-medium text-foreground hover:underline hover:text-primary cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRowClick) {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }}
                        >
                          {getRecordTitle(row, config)}
                        </Link>
                      ) : (
                        renderCellContent(col, row)
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
