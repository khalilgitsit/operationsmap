'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';
import { createProcessSchema, updateProcessSchema } from '@/lib/validations';
import type { ActionResult } from '@/types/actions';
import type { Database } from '@/types/database';

type ProcessRow = Database['public']['Tables']['processes']['Row'];

export async function createProcess(input: unknown): Promise<ActionResult<ProcessRow>> {
  const parsed = createProcessSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('processes')
    .insert({ ...parsed.data, organization_id: organizationId, created_by: userId, updated_by: userId })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logActivity({ supabase, organizationId, recordId: data.id, recordType: 'process', action: 'created', userId });
  return { success: true, data };
}

export async function updateProcess(id: string, input: unknown): Promise<ActionResult<ProcessRow>> {
  const parsed = updateProcessSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  const { data: oldData } = await supabase.from('processes').select().eq('id', id).single();

  const { data, error } = await supabase
    .from('processes')
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
          supabase, organizationId: data.organization_id, recordId: id, recordType: 'process',
          action: key === 'status' ? 'status_changed' : 'updated', userId, fieldName: key,
          oldValue: oldVal as Database['public']['Tables']['activity_log']['Row']['old_value'],
          newValue: value as Database['public']['Tables']['activity_log']['Row']['new_value'],
        });
      }
    }
  }

  return { success: true, data };
}

export async function deleteProcess(id: string): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();
  const { error } = await supabase.from('processes').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  await logActivity({ supabase, organizationId, recordId: id, recordType: 'process', action: 'updated', userId, fieldName: '_deleted' });
  return { success: true, data: null };
}

export async function getProcess(id: string): Promise<ActionResult<ProcessRow>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();
  const { data, error } = await supabase.from('processes').select().eq('id', id).single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function listProcesses(cursor?: string, limit: number = 50): Promise<ActionResult<{ items: ProcessRow[]; nextCursor: string | null }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();
  let query = supabase.from('processes').select().eq('organization_id', auth.organizationId).order('created_at', { ascending: false }).limit(limit + 1);
  if (cursor) query = query.lt('id', cursor);
  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  return { success: true, data: { items, nextCursor: hasMore ? items[items.length - 1].id : null } };
}
