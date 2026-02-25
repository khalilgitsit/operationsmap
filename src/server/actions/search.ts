'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import type { ActionResult } from '@/types/actions';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  objectType: string;
  objectLabel: string;
  status?: string;
  href: string;
}

interface SearchResultGroup {
  objectType: string;
  objectLabel: string;
  results: SearchResult[];
  totalCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(supabase: any, table: string): any {
  return supabase.from(table);
}

const SEARCH_CONFIGS = [
  {
    objectType: 'function',
    objectLabel: 'Functions',
    table: 'functions',
    titleField: 'title',
    searchFields: ['title', 'description'],
    subtitleField: null,
    statusField: 'status',
    href: (id: string) => `/functions/${id}`,
  },
  {
    objectType: 'subfunction',
    objectLabel: 'Subfunctions',
    table: 'subfunctions',
    titleField: 'title',
    searchFields: ['title', 'description'],
    subtitleField: null,
    subtitleJoin: { table: 'functions', fk: 'function_id', field: 'title', prefix: 'Function: ' },
    statusField: 'status',
    href: (id: string) => `/subfunctions/${id}`,
  },
  {
    objectType: 'process',
    objectLabel: 'Processes',
    table: 'processes',
    titleField: 'title',
    searchFields: ['title', 'description', 'trigger', 'end_state'],
    subtitleField: null,
    statusField: 'status',
    href: (id: string) => `/processes/${id}`,
  },
  {
    objectType: 'core_activity',
    objectLabel: 'Core Activities',
    table: 'core_activities',
    titleField: 'title',
    searchFields: ['title', 'description', 'trigger', 'end_state'],
    subtitleField: null,
    subtitleJoin: { table: 'subfunctions', fk: 'subfunction_id', field: 'title', prefix: 'Subfunction: ' },
    statusField: 'status',
    href: (id: string) => `/core-activities/${id}`,
  },
  {
    objectType: 'person',
    objectLabel: 'People',
    table: 'persons',
    titleField: null,
    titleFields: ['first_name', 'last_name'],
    searchFields: ['first_name', 'last_name', 'email', 'job_title'],
    subtitleField: 'job_title',
    statusField: 'status',
    href: (id: string) => `/people/${id}`,
  },
  {
    objectType: 'role',
    objectLabel: 'Roles',
    table: 'roles',
    titleField: 'title',
    searchFields: ['title', 'brief_description'],
    subtitleField: 'brief_description',
    statusField: 'status',
    href: (id: string) => `/roles/${id}`,
  },
  {
    objectType: 'software',
    objectLabel: 'Software',
    table: 'software',
    titleField: 'title',
    searchFields: ['title', 'description', 'url'],
    subtitleField: null,
    statusField: 'status',
    href: (id: string) => `/software/${id}`,
  },
  {
    objectType: 'workflow',
    objectLabel: 'Workflows',
    table: 'workflows',
    titleField: 'title',
    searchFields: ['title', 'description'],
    subtitleField: 'description',
    statusField: null,
    href: (id: string) => `/workflows/${id}`,
  },
] as const;

export async function globalSearch(
  query: string,
  options: { limit?: number } = {}
): Promise<ActionResult<SearchResultGroup[]>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();
  const limit = options.limit ?? 5;
  const searchTerm = `%${query}%`;

  const groups: SearchResultGroup[] = [];

  // Run all searches in parallel
  const searches = SEARCH_CONFIGS.map(async (config) => {
    const orFilters = config.searchFields
      .map((f) => `${f}.ilike.${searchTerm}`)
      .join(',');

    // Get count
    const { count } = await fromTable(supabase, config.table)
      .select('*', { count: 'exact', head: true })
      .or(orFilters);

    // Get results
    const { data, error } = await fromTable(supabase, config.table)
      .select('*')
      .or(orFilters)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error || !data?.length) return null;

    // For subtitleJoin configs, batch-fetch parent records
    const subtitleJoin = 'subtitleJoin' in config ? config.subtitleJoin : null;
    let parentMap: Record<string, string> = {};
    if (subtitleJoin) {
      const fkIds = (data as Record<string, unknown>[])
        .map((r) => r[subtitleJoin.fk] as string)
        .filter(Boolean);
      if (fkIds.length > 0) {
        const { data: parents } = await fromTable(supabase, subtitleJoin.table)
          .select(`id,${subtitleJoin.field}`)
          .in('id', fkIds);
        if (parents) {
          parentMap = Object.fromEntries(
            (parents as Record<string, unknown>[]).map((p) => [p.id as string, p[subtitleJoin.field] as string])
          );
        }
      }
    }

    const results: SearchResult[] = (data as Record<string, unknown>[]).map((row) => {
      let title: string;
      if ('titleFields' in config && config.titleFields) {
        title = config.titleFields.map((f) => row[f] || '').join(' ').trim() || 'Untitled';
      } else {
        title = (row[config.titleField as string] as string) || 'Untitled';
      }

      let subtitle: string | undefined;
      if (subtitleJoin && row[subtitleJoin.fk]) {
        const parentTitle = parentMap[row[subtitleJoin.fk] as string];
        if (parentTitle) subtitle = `${subtitleJoin.prefix}${parentTitle}`;
      } else if (config.subtitleField) {
        const val = row[config.subtitleField] as string;
        if (val) subtitle = val.length > 80 ? val.slice(0, 80) + '...' : val;
      }

      return {
        id: row.id as string,
        title,
        subtitle,
        objectType: config.objectType,
        objectLabel: config.objectLabel,
        status: config.statusField ? (row[config.statusField] as string) : undefined,
        href: config.href(row.id as string),
      };
    });

    return {
      objectType: config.objectType,
      objectLabel: config.objectLabel,
      results,
      totalCount: count ?? results.length,
    };
  });

  const results = await Promise.all(searches);
  for (const result of results) {
    if (result) groups.push(result);
  }

  return { success: true, data: groups };
}
