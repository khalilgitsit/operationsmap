'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { globalSearch, type SearchResult } from '@/server/actions/search';

interface SearchResultGroup {
  objectType: string;
  objectLabel: string;
  results: SearchResult[];
  totalCount: number;
}

const TYPE_COLORS: Record<string, string> = {
  function: 'bg-blue-100 text-blue-700',
  subfunction: 'bg-sky-100 text-sky-700',
  process: 'bg-purple-100 text-purple-700',
  core_activity: 'bg-amber-100 text-amber-700',
  person: 'bg-green-100 text-green-700',
  role: 'bg-teal-100 text-teal-700',
  software: 'bg-pink-100 text-pink-700',
  workflow: 'bg-indigo-100 text-indigo-700',
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setGroups([]);
      return;
    }
    setIsLoading(true);
    const result = await globalSearch(q, { limit: 50 });
    if (result.success) {
      setGroups(result.data);
      // Expand all groups by default
      setExpandedGroups(new Set(result.data.map((g) => g.objectType)));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    doSearch(query);
  }, [query, doSearch]);

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const totalResults = groups.reduce((sum, g) => sum + g.totalCount, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={query ? `Search results for "${query}"` : 'Search'}
        backHref="/"
        backLabel="Dashboard"
      />

      {isLoading ? (
        <div className="space-y-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ))}
        </div>
      ) : !query.trim() ? (
        <div className="mt-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Enter a search term to find records across all object types.</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="mt-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try a different search term or check your spelling.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            {totalResults} result{totalResults !== 1 ? 's' : ''} across{' '}
            {groups.length} type{groups.length !== 1 ? 's' : ''}
          </p>

          <div className="space-y-4">
            {groups.map((group) => {
              const isExpanded = expandedGroups.has(group.objectType);
              return (
                <div key={group.objectType} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
                    onClick={() => toggleGroup(group.objectType)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{group.objectLabel}</span>
                      <span className="text-xs text-muted-foreground">
                        ({group.totalCount})
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="divide-y">
                      {group.results.map((result) => (
                        <Link
                          key={result.id}
                          href={result.href}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                        >
                          <span
                            className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              TYPE_COLORS[result.objectType] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {result.objectType === 'core_activity'
                              ? 'CA'
                              : group.objectLabel.slice(0, 3).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{result.title}</div>
                            {result.subtitle && (
                              <div className="truncate text-xs text-muted-foreground">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          {result.status && <StatusBadge status={result.status} />}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
