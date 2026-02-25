'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';
import { createRoleSchema, updateRoleSchema } from '@/lib/validations';
import type { ActionResult } from '@/types/actions';
import type { Database } from '@/types/database';

type RoleRow = Database['public']['Tables']['roles']['Row'];

export async function createRole(input: unknown): Promise<ActionResult<RoleRow>> {
  const parsed = createRoleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { userId, organizationId } = await getAuthContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('roles')
    .insert({ ...parsed.data, organization_id: organizationId, created_by: userId, updated_by: userId })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  await logActivity({ supabase, organizationId, recordId: data.id, recordType: 'role', action: 'created', userId });
  return { success: true, data };
}

export async function updateRole(id: string, input: unknown): Promise<ActionResult<RoleRow>> {
  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const { userId } = await getAuthContext();
  const supabase = await createClient();

  const { data: oldData } = await supabase.from('roles').select().eq('id', id).single();

  const { data, error } = await supabase
    .from('roles')
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
          supabase, organizationId: data.organization_id, recordId: id, recordType: 'role',
          action: key === 'status' ? 'status_changed' : 'updated', userId, fieldName: key,
          oldValue: oldVal as Database['public']['Tables']['activity_log']['Row']['old_value'],
          newValue: value as Database['public']['Tables']['activity_log']['Row']['new_value'],
        });
      }
    }
  }

  return { success: true, data };
}

export async function deleteRole(id: string): Promise<ActionResult<null>> {
  const { userId, organizationId } = await getAuthContext();
  const supabase = await createClient();
  const { error } = await supabase.from('roles').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  await logActivity({ supabase, organizationId, recordId: id, recordType: 'role', action: 'updated', userId, fieldName: '_deleted' });
  return { success: true, data: null };
}

export async function getRole(id: string): Promise<ActionResult<RoleRow>> {
  await getAuthContext();
  const supabase = await createClient();
  const { data, error } = await supabase.from('roles').select().eq('id', id).single();
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function listRoles(cursor?: string, limit: number = 50): Promise<ActionResult<{ items: RoleRow[]; nextCursor: string | null }>> {
  await getAuthContext();
  const supabase = await createClient();
  let query = supabase.from('roles').select().order('created_at', { ascending: false }).limit(limit + 1);
  if (cursor) query = query.lt('id', cursor);
  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;
  return { success: true, data: { items, nextCursor: hasMore ? items[items.length - 1].id : null } };
}
