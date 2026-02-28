'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';
import { createFunctionSchema, updateFunctionSchema } from '@/lib/validations';
import type { ActionResult } from '@/types/actions';
import type { Database } from '@/types/database';

type FunctionRow = Database['public']['Tables']['functions']['Row'];

export async function createFunction(
  input: unknown
): Promise<ActionResult<FunctionRow>> {
  const parsed = createFunctionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('functions')
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
    supabase,
    organizationId,
    recordId: data.id,
    recordType: 'function',
    action: 'created',
    userId,
  });

  return { success: true, data };
}

export async function updateFunction(
  id: string,
  input: unknown
): Promise<ActionResult<FunctionRow>> {
  const parsed = updateFunctionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  // Fetch old values for activity logging
  const { data: oldData } = await supabase.from('functions').select().eq('id', id).single();

  const { data, error } = await supabase
    .from('functions')
    .update({ ...parsed.data, updated_by: userId })
    .eq('id', id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Log changes
  if (oldData) {
    const changes = Object.entries(parsed.data) as [string, unknown][];
    for (const [key, value] of changes) {
      const oldVal = (oldData as Record<string, unknown>)[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(value)) {
        const action = key === 'status' ? 'status_changed' as const : 'updated' as const;
        await logActivity({
          supabase,
          organizationId: data.organization_id,
          recordId: id,
          recordType: 'function',
          action,
          userId,
          fieldName: key,
          oldValue: oldVal as Database['public']['Tables']['activity_log']['Row']['old_value'],
          newValue: value as Database['public']['Tables']['activity_log']['Row']['new_value'],
        });
      }
    }
  }

  return { success: true, data };
}

export async function deleteFunction(id: string): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  const { error } = await supabase.from('functions').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  await logActivity({
    supabase,
    organizationId,
    recordId: id,
    recordType: 'function',
    action: 'updated',
    userId,
    fieldName: '_deleted',
  });

  return { success: true, data: null };
}

export async function getFunction(id: string): Promise<ActionResult<FunctionRow>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data, error } = await supabase.from('functions').select().eq('id', id).single();
  if (error) return { success: false, error: error.message };

  return { success: true, data };
}

export async function listFunctions(
  cursor?: string,
  limit: number = 50
): Promise<ActionResult<{ items: FunctionRow[]; nextCursor: string | null }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  let query = supabase
    .from('functions')
    .select()
    .eq('organization_id', auth.organizationId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('id', cursor);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { success: true, data: { items, nextCursor } };
}
