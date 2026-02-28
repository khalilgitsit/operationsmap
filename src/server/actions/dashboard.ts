'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import type { ActionResult } from '@/types/actions';

export interface StatusCounts {
  total: number;
  active: number;
  draft: number;
  needsUpdate: number;
  inReview: number;
  archived: number;
}

export interface DashboardData {
  coreActivities: StatusCounts;
  processes: StatusCounts & { empty: number };
  functions: { total: number };
  subfunctions: { total: number };
  people: { total: number };
  roles: { total: number };
  softwareSpend: number;
  recentActivity: ActivityEntry[];
  suggestions: Suggestion[];
}

export interface ActivityEntry {
  id: string;
  action: string;
  recordId: string;
  recordType: string;
  fieldName: string | null;
  oldValue: unknown;
  newValue: unknown;
  commentText: string | null;
  userId: string;
  userEmail?: string;
  recordTitle?: string;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  message: string;
  href: string;
  priority: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(supabase: any, table: string): any {
  return supabase.from(table);
}

async function getStatusCounts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: string,
  organizationId: string
): Promise<StatusCounts> {
  const { data, error } = await fromTable(supabase, table)
    .select('status')
    .eq('organization_id', organizationId);
  if (error || !data) return { total: 0, active: 0, draft: 0, needsUpdate: 0, inReview: 0, archived: 0 };

  const rows = data as { status: string }[];
  return {
    total: rows.length,
    active: rows.filter((r) => r.status === 'Active').length,
    draft: rows.filter((r) => r.status === 'Draft').length,
    needsUpdate: rows.filter((r) => r.status === 'Needs Update').length,
    inReview: rows.filter((r) => r.status === 'In Review').length,
    archived: rows.filter((r) => r.status === 'Archived').length,
  };
}

export async function getDashboardData(): Promise<ActionResult<DashboardData>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // Run all queries in parallel
  const orgId = auth.organizationId;

  const [
    caCounts,
    processCounts,
    functionCount,
    subfunctionCount,
    peopleCount,
    roleCount,
    softwareData,
    activityData,
    // For suggestions
    draftCAs,
    emptyProcesses,
    subfunctionsNoOwner,
    casNoSubfunction,
  ] = await Promise.all([
    // Core Activity status counts
    getStatusCounts(supabase, 'core_activities', orgId),
    // Process status counts
    getStatusCounts(supabase, 'processes', orgId),
    // Function count
    fromTable(supabase, 'functions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    // Subfunction count
    fromTable(supabase, 'subfunctions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    // People count
    fromTable(supabase, 'persons').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    // Role count
    fromTable(supabase, 'roles').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
    // Software spend (sum total_current_cost)
    fromTable(supabase, 'software').select('monthly_cost,annual_cost').eq('organization_id', orgId),
    // Recent activity (last 10)
    supabase
      .from('activity_log')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10),
    // Suggestions: draft CAs
    fromTable(supabase, 'core_activities').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'Draft'),
    // Suggestions: processes with no core activities
    (async () => {
      const { data: allProcesses } = await fromTable(supabase, 'processes').select('id').eq('organization_id', orgId);
      if (!allProcesses?.length) return { count: 0 };
      const { data: linkedProcesses } = await fromTable(supabase, 'process_core_activities')
        .select('process_id');
      const linkedIds = new Set((linkedProcesses || []).map((r: Record<string, unknown>) => r.process_id));
      const empty = (allProcesses as { id: string }[]).filter((p) => !linkedIds.has(p.id));
      return { count: empty.length };
    })(),
    // Suggestions: subfunctions without owner
    fromTable(supabase, 'subfunctions').select('id,title').eq('organization_id', orgId).is('owner_id', null).limit(5),
    // Suggestions: CAs without subfunction
    fromTable(supabase, 'core_activities').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).is('subfunction_id', null),
  ]);

  // Calculate software spend
  let totalSoftwareSpend = 0;
  if (softwareData.data) {
    for (const sw of softwareData.data as { monthly_cost: number | null; annual_cost: number | null }[]) {
      // Prefer annual, fallback to monthly * 12
      if (sw.annual_cost) {
        totalSoftwareSpend += sw.annual_cost;
      } else if (sw.monthly_cost) {
        totalSoftwareSpend += sw.monthly_cost * 12;
      }
    }
  }

  // Resolve activity titles
  const activityEntries: ActivityEntry[] = [];
  if (activityData.data) {
    const recordIds = new Map<string, Set<string>>();
    for (const entry of activityData.data as Record<string, unknown>[]) {
      const type = entry.record_type as string;
      if (!recordIds.has(type)) recordIds.set(type, new Set());
      recordIds.get(type)!.add(entry.record_id as string);
    }

    // Batch fetch record titles
    const TABLE_MAP: Record<string, string> = {
      function: 'functions',
      subfunction: 'subfunctions',
      process: 'processes',
      core_activity: 'core_activities',
      person: 'persons',
      role: 'roles',
      software: 'software',
      sop: 'sops',
      checklist: 'checklists',
      template: 'templates',
    };

    const titleMap: Record<string, string> = {};
    const titleFetches = Array.from(recordIds.entries()).map(async ([type, ids]) => {
      const table = TABLE_MAP[type];
      if (!table) return;
      const selectFields = type === 'person' ? 'id,first_name,last_name' : 'id,title';
      const { data } = await fromTable(supabase, table)
        .select(selectFields)
        .in('id', Array.from(ids));
      if (data) {
        for (const row of data as Record<string, unknown>[]) {
          titleMap[row.id as string] = type === 'person'
            ? `${row.first_name || ''} ${row.last_name || ''}`.trim()
            : (row.title as string) || 'Untitled';
        }
      }
    });
    await Promise.all(titleFetches);

    for (const entry of activityData.data as Record<string, unknown>[]) {
      activityEntries.push({
        id: entry.id as string,
        action: entry.action as string,
        recordId: entry.record_id as string,
        recordType: entry.record_type as string,
        fieldName: entry.field_name as string | null,
        oldValue: entry.old_value,
        newValue: entry.new_value,
        commentText: entry.comment_text as string | null,
        userId: entry.user_id as string,
        recordTitle: titleMap[entry.record_id as string] || 'Deleted record',
        createdAt: entry.created_at as string,
      });
    }
  }

  // Empty processes count
  const emptyProcessCount = typeof emptyProcesses === 'object' && 'count' in emptyProcesses
    ? (emptyProcesses as { count: number }).count
    : 0;

  // Build suggestions
  const suggestions: Suggestion[] = [];
  const draftCACount = draftCAs.count ?? 0;
  if (draftCACount > 0) {
    suggestions.push({
      id: 'draft-cas',
      message: `You have ${draftCACount} Draft Core Activit${draftCACount === 1 ? 'y' : 'ies'} — start documenting`,
      href: '/core-activities?status=Draft',
      priority: 1,
    });
  }

  if (emptyProcessCount > 0) {
    suggestions.push({
      id: 'empty-processes',
      message: `${emptyProcessCount} Process${emptyProcessCount === 1 ? '' : 'es'} ha${emptyProcessCount === 1 ? 's' : 've'} no Core Activities`,
      href: '/processes',
      priority: 2,
    });
  }

  if (subfunctionsNoOwner.data?.length) {
    const count = subfunctionsNoOwner.data.length;
    const first = (subfunctionsNoOwner.data[0] as Record<string, unknown>).title || 'Untitled';
    if (count === 1) {
      suggestions.push({
        id: 'subfunc-no-owner',
        message: `"${first}" needs an owner`,
        href: `/subfunctions/${(subfunctionsNoOwner.data[0] as Record<string, unknown>).id}`,
        priority: 3,
      });
    } else {
      suggestions.push({
        id: 'subfunc-no-owner',
        message: `${count} Subfunctions need an owner (starting with "${first}")`,
        href: '/subfunctions',
        priority: 3,
      });
    }
  }

  const casNoSubCount = casNoSubfunction.count ?? 0;
  if (casNoSubCount > 0) {
    suggestions.push({
      id: 'cas-no-subfunction',
      message: `${casNoSubCount} Core Activit${casNoSubCount === 1 ? 'y needs' : 'ies need'} a primary Subfunction`,
      href: '/core-activities',
      priority: 4,
    });
  }

  suggestions.sort((a, b) => a.priority - b.priority);

  return {
    success: true,
    data: {
      coreActivities: caCounts,
      processes: { ...processCounts, empty: emptyProcessCount },
      functions: { total: functionCount.count ?? 0 },
      subfunctions: { total: subfunctionCount.count ?? 0 },
      people: { total: peopleCount.count ?? 0 },
      roles: { total: roleCount.count ?? 0 },
      softwareSpend: totalSoftwareSpend,
      recentActivity: activityEntries,
      suggestions,
    },
  };
}
