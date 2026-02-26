'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';
import { createNotification } from '@/lib/notifications';
import type { ActionResult } from '@/types/actions';
import type { Database } from '@/types/database';

type ObjectType = Database['public']['Enums']['object_type'];
type TableName = keyof Database['public']['Tables'];

const TABLE_MAP: Record<string, TableName> = {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(supabase: any, table: string): any {
  return supabase.from(table);
}

export async function listRecords(
  objectType: string,
  options: {
    cursor?: string;
    limit?: number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    filters?: Record<string, string>;
    search?: string;
    searchFields?: string[];
  } = {}
): Promise<ActionResult<{ items: Record<string, unknown>[]; nextCursor: string | null; totalCount: number }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();
  const table = TABLE_MAP[objectType];
  if (!table) return { success: false, error: `Unknown object type: ${objectType}` };

  const limit = options.limit ?? 50;
  const sortField = options.sortField ?? 'created_at';
  const sortDirection = options.sortDirection ?? 'desc';

  // Get total count
  const { count, error: countError } = await fromTable(supabase, table)
    .select('*', { count: 'exact', head: true });
  if (countError) return { success: false, error: countError.message };

  let query = fromTable(supabase, table)
    .select('*')
    .order(sortField, { ascending: sortDirection === 'asc' })
    .limit(limit + 1);

  // Apply filters
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value) {
        query = query.eq(key, value);
      }
    }
  }

  // Apply search
  if (options.search && options.searchFields?.length) {
    const searchTerm = `%${options.search}%`;
    const orFilters = options.searchFields.map((f) => `${f}.ilike.${searchTerm}`).join(',');
    query = query.or(orFilters);
  }

  // Apply cursor
  if (options.cursor) {
    if (sortDirection === 'desc') {
      query = query.lt(sortField, options.cursor);
    } else {
      query = query.gt(sortField, options.cursor);
    }
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  const hasMore = (data?.length ?? 0) > limit;
  const items = hasMore ? data!.slice(0, limit) : (data ?? []);
  const nextCursor = hasMore && items.length > 0
    ? String((items[items.length - 1] as Record<string, unknown>)[sortField])
    : null;

  return {
    success: true,
    data: {
      items: items as unknown as Record<string, unknown>[],
      nextCursor,
      totalCount: count ?? 0,
    },
  };
}

export async function getRecord(
  objectType: string,
  id: string
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();
  const table = TABLE_MAP[objectType];
  if (!table) return { success: false, error: `Unknown object type: ${objectType}` };

  const { data, error } = await fromTable(supabase, table).select('*').eq('id', id).single();
  if (error) return { success: false, error: error.message };

  return { success: true, data: data as unknown as Record<string, unknown> };
}

export async function updateRecord(
  objectType: string,
  id: string,
  updates: Record<string, unknown>
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();
  const table = TABLE_MAP[objectType];
  if (!table) return { success: false, error: `Unknown object type: ${objectType}` };

  // Fetch old values
  const { data: oldData } = await fromTable(supabase, table).select('*').eq('id', id).single();

  const { data, error } = await fromTable(supabase, table)
    .update({ ...updates, updated_by: userId } as never)
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Log changes and create notifications
  if (oldData) {
    const typedOld = oldData as Record<string, unknown>;
    const orgId = (data as Record<string, unknown>).organization_id as string;
    for (const [key, value] of Object.entries(updates)) {
      if (JSON.stringify(typedOld[key]) !== JSON.stringify(value)) {
        const action = key === 'status' ? 'status_changed' as const : 'updated' as const;
        await logActivity({
          supabase,
          organizationId: orgId,
          recordId: id,
          recordType: objectType as ObjectType,
          action,
          userId,
          fieldName: key,
          oldValue: typedOld[key] as null,
          newValue: value as null,
        });

        // Notify on status change
        if (key === 'status') {
          await createNotification({
            organizationId: orgId,
            recordId: id,
            recordType: objectType,
            message: `Status changed to "${value}" on ${(data as Record<string, unknown>).title || 'a record'}`,
            excludeUserId: userId,
          });
        }
      }
    }
  }

  return { success: true, data: data as unknown as Record<string, unknown> };
}

export async function createRecord(
  objectType: string,
  input: Record<string, unknown>
): Promise<ActionResult<Record<string, unknown>>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();
  const table = TABLE_MAP[objectType];
  if (!table) return { success: false, error: `Unknown object type: ${objectType}` };

  const { data, error } = await fromTable(supabase, table)
    .insert({
      ...input,
      organization_id: organizationId,
      created_by: userId,
      updated_by: userId,
    } as never)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logActivity({
    supabase,
    organizationId,
    recordId: (data as Record<string, unknown>).id as string,
    recordType: objectType as ObjectType,
    action: 'created',
    userId,
  });

  return { success: true, data: data as unknown as Record<string, unknown> };
}

export async function deleteRecord(
  objectType: string,
  id: string
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();
  const table = TABLE_MAP[objectType];
  if (!table) return { success: false, error: `Unknown object type: ${objectType}` };

  const { error } = await fromTable(supabase, table).delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  await logActivity({
    supabase,
    organizationId,
    recordId: id,
    recordType: objectType as ObjectType,
    action: 'deleted',
    userId,
  });

  return { success: true, data: null };
}

export async function searchRecords(
  objectType: string,
  query: string,
  limit: number = 20
): Promise<ActionResult<{ id: string; label: string }[]>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();
  const table = TABLE_MAP[objectType];
  if (!table) return { success: false, error: `Unknown object type: ${objectType}` };

  // Determine label fields based on type
  const labelFields = objectType === 'person' ? 'id,first_name,last_name' : 'id,title';

  let dbQuery = fromTable(supabase, table).select(labelFields).limit(limit);

  if (query) {
    if (objectType === 'person') {
      dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`);
    } else {
      dbQuery = dbQuery.ilike('title', `%${query}%`);
    }
  }

  const { data, error } = await dbQuery;
  if (error) return { success: false, error: error.message };

  const items = (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    label: objectType === 'person'
      ? `${row.first_name || ''} ${row.last_name || ''}`.trim()
      : (row.title as string) || 'Untitled',
  }));

  return { success: true, data: items };
}

export async function getActivityLog(
  recordId: string,
  cursor?: string,
  limit: number = 20
): Promise<ActionResult<{ items: Record<string, unknown>[]; nextCursor: string | null }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  let query = supabase
    .from('activity_log')
    .select('*')
    .eq('record_id', recordId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  const hasMore = (data?.length ?? 0) > limit;
  const items = hasMore ? data!.slice(0, limit) : (data ?? []);
  const nextCursor = hasMore && items.length > 0
    ? (items[items.length - 1] as Record<string, unknown>).created_at as string
    : null;

  return { success: true, data: { items: items as unknown as Record<string, unknown>[], nextCursor } };
}

export async function addComment(
  recordId: string,
  recordType: string,
  commentText: string
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  try {
    await logActivity({
      supabase,
      organizationId,
      recordId,
      recordType: recordType as ObjectType,
      action: 'comment',
      userId,
      commentText,
    });
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save comment' };
  }

  // Notify record owner about the comment
  const preview = commentText.length > 60 ? commentText.slice(0, 60) + '...' : commentText;
  await createNotification({
    organizationId,
    recordId,
    recordType,
    message: `New comment: "${preview}"`,
    excludeUserId: userId,
  });

  return { success: true, data: null };
}

export async function getAssociations(
  objectType: string,
  recordId: string,
  junctionTable: string,
  targetType: string
): Promise<ActionResult<Record<string, unknown>[]>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();
  const targetTable = TABLE_MAP[targetType];
  if (!targetTable) return { success: false, error: `Unknown target type: ${targetType}` };

  // Handle parent-child relationships (not junction tables)
  if (junctionTable === '_children') {
    const parentCol = objectType === 'function' ? 'function_id' : 'subfunction_id';
    const { data, error } = await fromTable(supabase, targetTable)
      .select('*')
      .eq(parentCol, recordId)
      .order('created_at', { ascending: true });

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data ?? []) as unknown as Record<string, unknown>[] };
  }

  // Determine column names from junction table name
  const sourceCol = getSourceCol(objectType);
  const targetCol = getTargetCol(targetType, junctionTable);

  // Query junction table to get target IDs
  const { data: junctionData, error: junctionError } = await fromTable(supabase, junctionTable as TableName)
    .select('*')
    .eq(sourceCol, recordId);

  if (junctionError) return { success: false, error: junctionError.message };
  if (!junctionData?.length) return { success: true, data: [] };

  const targetIds = (junctionData as Record<string, unknown>[]).map((row) => row[targetCol] as string);

  // Fetch target records
  const { data: targets, error: targetError } = await fromTable(supabase, targetTable)
    .select('*')
    .in('id', targetIds);

  if (targetError) return { success: false, error: targetError.message };

  return { success: true, data: (targets ?? []) as unknown as Record<string, unknown>[] };
}

function getSourceCol(objectType: string): string {
  const map: Record<string, string> = {
    function: 'function_id',
    subfunction: 'subfunction_id',
    process: 'process_id',
    core_activity: 'core_activity_id',
    person: 'person_id',
    role: 'role_id',
    software: 'software_id',
    sop: 'sop_id',
    checklist: 'checklist_id',
    template: 'template_id',
  };
  return map[objectType] || `${objectType}_id`;
}

function getTargetCol(targetType: string, junctionTable: string): string {
  // Handle special cases where the column name includes extra context
  if (junctionTable.includes('roles_involved')) return 'role_id';
  if (junctionTable.includes('people_involved')) return 'person_id';

  const map: Record<string, string> = {
    function: 'function_id',
    subfunction: 'subfunction_id',
    process: 'process_id',
    core_activity: 'core_activity_id',
    person: 'person_id',
    role: 'role_id',
    software: 'software_id',
    sop: 'sop_id',
    checklist: 'checklist_id',
    template: 'template_id',
  };
  return map[targetType] || `${targetType}_id`;
}
