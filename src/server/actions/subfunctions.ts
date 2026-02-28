'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';
import { createSubfunctionSchema, updateSubfunctionSchema } from '@/lib/validations';
import type { ActionResult } from '@/types/actions';
import type { Database } from '@/types/database';

type SubfunctionRow = Database['public']['Tables']['subfunctions']['Row'];

export async function createSubfunction(
  input: unknown
): Promise<ActionResult<SubfunctionRow>> {
  const parsed = createSubfunctionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subfunctions')
    .insert({
      ...parsed.data,
      organization_id: organizationId,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logActivity({
    supabase, organizationId, recordId: data.id, recordType: 'subfunction', action: 'created', userId,
  });

  return { success: true, data };
}

export async function updateSubfunction(
  id: string,
  input: unknown
): Promise<ActionResult<SubfunctionRow>> {
  const parsed = updateSubfunctionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  const { data: oldData } = await supabase.from('subfunctions').select().eq('id', id).single();

  const { data, error } = await supabase
    .from('subfunctions')
    .update({ ...parsed.data, updated_by: userId })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  if (oldData) {
    for (const [key, value] of Object.entries(parsed.data) as [string, unknown][]) {
      const oldVal = (oldData as Record<string, unknown>)[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(value)) {
        await logActivity({
          supabase, organizationId: data.organization_id, recordId: id, recordType: 'subfunction',
          action: key === 'status' ? 'status_changed' : 'updated', userId, fieldName: key,
          oldValue: oldVal as Database['public']['Tables']['activity_log']['Row']['old_value'],
          newValue: value as Database['public']['Tables']['activity_log']['Row']['new_value'],
        });
      }
    }
  }

  return { success: true, data };
}

export async function deleteSubfunction(id: string): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  const { error } = await supabase.from('subfunctions').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  await logActivity({ supabase, organizationId, recordId: id, recordType: 'subfunction', action: 'updated', userId, fieldName: '_deleted' });
  return { success: true, data: null };
}

export async function getSubfunction(id: string): Promise<ActionResult<SubfunctionRow>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('subfunctions').select().eq('id', id).single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function listSubfunctions(
  cursor?: string,
  limit: number = 50
): Promise<ActionResult<{ items: SubfunctionRow[]; nextCursor: string | null }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  let query = supabase.from('subfunctions').select().eq('organization_id', auth.organizationId).order('created_at', { ascending: false }).limit(limit + 1);
  if (cursor) query = query.lt('id', cursor);

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  return { success: true, data: { items, nextCursor: hasMore ? items[items.length - 1].id : null } };
}
