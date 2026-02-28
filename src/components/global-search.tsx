'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/status-badge';
import { TYPE_COLORS, DEFAULT_BADGE_COLORS } from '@/lib/object-config';
import { globalSearch, type SearchResult } from '@/server/actions/search';

const TYPE_ABBREVIATIONS: Record<string, string> = {
  function: 'FUN',
  subfunction: 'SUB',
  process: 'PRC',
  core_activity: 'CA',
  person: 'PER',
  role: 'ROL',
  software: 'SW',
  sop: 'SOP',
  checklist: 'CHK',
  template: 'TPL',
  workflow: 'WF',
};

interface SearchResultGroup {
  objectType: string;
  objectLabel: string;
  results: SearchResult[];
  totalCount: number;
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<SearchResultGroup[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Flatten results for keyboard navigation
  const flatResults = groups.flatMap((g) => g.results);

  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setGroups([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    const result = await globalSearch(searchQuery, { limit: 5 });
    if (result.success) {
      setGroups(result.data);
      setIsOpen(true);
    }
    setIsLoading(false);
    setActiveIndex(-1);
  }, []);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(value), 300);
    },
    [doSearch]
  );

  const navigateTo = useCallback(
    (href: string) => {
      setIsOpen(false);
      setQuery('');
      router.push(href);
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen && e.key !== 'Enter') return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < flatResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < flatResults.length) {
            navigateTo(flatResults[activeIndex].href);
          } else if (query.trim()) {
            navigateTo(`/search?q=${encodeURIComponent(query.trim())}`);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setActiveIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, activeIndex, flatResults, navigateTo, query]
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      {isLoading && (
        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
      )}
      <Input
        ref={inputRef}
        placeholder="Search across all objects..."
        className="pl-9 h-9"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (groups.length > 0 && query.trim()) setIsOpen(true);
        }}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[420px] overflow-y-auto rounded-md border bg-popover shadow-lg">
          {groups.length === 0 && !isLoading ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {groups.map((group) => (
                <div key={group.objectType}>
                  <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span>{group.objectLabel}</span>
                    <span className="text-[10px]">{group.totalCount} result{group.totalCount !== 1 ? 's' : ''}</span>
                  </div>
                  {group.results.map((result) => {
                    flatIndex++;
                    const currentFlatIndex = flatIndex;
                    return (
                      <button
                        key={result.id}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-accent transition-colors ${
                          activeIndex === currentFlatIndex ? 'bg-accent' : ''
                        }`}
                        onClick={() => navigateTo(result.href)}
                        onMouseEnter={() => setActiveIndex(currentFlatIndex)}
                      >
                        <span
                          className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            TYPE_COLORS[result.objectType] || DEFAULT_BADGE_COLORS
                          }`}
                        >
                          {TYPE_ABBREVIATIONS[result.objectType] || result.objectLabel.slice(0, 3).toUpperCase()}
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
                      </button>
                    );
                  })}
                </div>
              ))}
              <button
                className="w-full px-3 py-2 text-xs text-center text-muted-foreground hover:bg-accent transition-colors border-t"
                onClick={() => navigateTo(`/search?q=${encodeURIComponent(query.trim())}`)}
              >
                View all results
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
