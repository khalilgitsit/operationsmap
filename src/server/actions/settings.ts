'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import type { ActionResult } from '@/types/actions';

// ---- Company Profile ----

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string | null;
  revenue: number | null;
  location: string | null;
  key_objectives: string | null;
  company_description: string | null;
  biggest_pains: string | null;
  employeeCount: number;
}

export async function getCompanyProfile(): Promise<ActionResult<CompanyProfile>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', auth.organizationId)
    .single();

  if (error) return { success: false, error: error.message };

  // Count employees (persons in org)
  const { count } = await supabase
    .from('persons')
    .select('*', { count: 'exact', head: true });

  return {
    success: true,
    data: {
      ...(data as unknown as Omit<CompanyProfile, 'employeeCount'>),
      employeeCount: count ?? 0,
    },
  };
}

export async function updateCompanyProfile(
  updates: Partial<Pick<CompanyProfile, 'name' | 'industry' | 'revenue' | 'location' | 'key_objectives' | 'company_description' | 'biggest_pains'>>
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await supabase
    .from('organizations')
    .update(updates as never)
    .eq('id', auth.organizationId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// ---- Custom Properties Management ----

export interface CustomPropertyDef {
  id: string;
  object_type: string;
  property_name: string;
  property_type: string;
  options: unknown;
  position: number;
}

export async function listCustomProperties(objectType: string): Promise<ActionResult<CustomPropertyDef[]>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('custom_properties')
    .select('*')
    .eq('organization_id', auth.organizationId)
    .eq('object_type', objectType as never)
    .order('position', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as unknown as CustomPropertyDef[] };
}

export async function createCustomProperty(
  objectType: string,
  propertyName: string,
  propertyType: string,
  options?: string[]
): Promise<ActionResult<CustomPropertyDef>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // Get next position
  const { data: existing } = await supabase
    .from('custom_properties')
    .select('position')
    .eq('organization_id', auth.organizationId)
    .eq('object_type', objectType as never)
    .order('position', { ascending: false })
    .limit(1);

  const nextPos = existing?.length ? (existing[0] as { position: number }).position + 1 : 0;

  const { data, error } = await supabase
    .from('custom_properties')
    .insert({
      organization_id: auth.organizationId,
      object_type: objectType,
      property_name: propertyName,
      property_type: propertyType,
      options: options ? (options as unknown as never) : null,
      position: nextPos,
    } as never)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as unknown as CustomPropertyDef };
}

export async function updateCustomProperty(
  id: string,
  updates: { property_name?: string; property_type?: string; options?: string[] | null }
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await supabase
    .from('custom_properties')
    .update(updates as never)
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function deleteCustomProperty(id: string): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // Delete values first
  await supabase.from('custom_property_values').delete().eq('custom_property_id', id);
  const { error } = await supabase.from('custom_properties').delete().eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function reorderCustomProperties(
  objectType: string,
  orderedIds: string[]
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const updates = orderedIds.map((id, i) =>
    supabase.from('custom_properties').update({ position: i } as never).eq('id', id)
  );
  await Promise.all(updates);

  return { success: true, data: null };
}

// ---- User Management ----

export interface OrgUser {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
}

export async function listOrgUsers(): Promise<ActionResult<OrgUser[]>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const serviceClient = await createServiceClient();

  const { data: userOrgs, error } = await serviceClient
    .from('user_organizations')
    .select('user_id, role, created_at')
    .eq('organization_id', auth.organizationId);

  if (error) return { success: false, error: error.message };

  // Fetch user emails from auth
  const users: OrgUser[] = [];
  for (const uo of (userOrgs || []) as { user_id: string; role: string; created_at: string }[]) {
    const { data: { user } } = await serviceClient.auth.admin.getUserById(uo.user_id);
    users.push({
      userId: uo.user_id,
      email: user?.email || 'Unknown',
      role: uo.role,
      createdAt: uo.created_at,
    });
  }

  return { success: true, data: users };
}

export async function inviteUser(email: string): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const serviceClient = await createServiceClient();

  // Check user role is admin
  const { data: myOrg } = await serviceClient
    .from('user_organizations')
    .select('role')
    .eq('user_id', auth.userId)
    .eq('organization_id', auth.organizationId)
    .single();

  if (!myOrg || (myOrg as { role: string }).role !== 'admin') {
    return { success: false, error: 'Only admins can invite users' };
  }

  // Create user via admin API with auto-confirm
  const { data: { user }, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    email_confirm: true,
    password: crypto.randomUUID(), // Temporary password; user will reset
  });

  if (createError) {
    if (createError.message.includes('already registered')) {
      return { success: false, error: 'User with this email already exists' };
    }
    return { success: false, error: createError.message };
  }
  if (!user) return { success: false, error: 'Failed to create user' };

  // Link to org
  const { error: linkError } = await serviceClient
    .from('user_organizations')
    .insert({
      user_id: user.id,
      organization_id: auth.organizationId,
      role: 'member',
    } as never);

  if (linkError) return { success: false, error: linkError.message };

  return { success: true, data: null };
}

export async function changeUserRole(targetUserId: string, newRole: 'admin' | 'member'): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const serviceClient = await createServiceClient();

  // Check caller is admin
  const { data: myOrg } = await serviceClient
    .from('user_organizations')
    .select('role')
    .eq('user_id', auth.userId)
    .eq('organization_id', auth.organizationId)
    .single();

  if (!myOrg || (myOrg as { role: string }).role !== 'admin') {
    return { success: false, error: 'Only admins can change roles' };
  }

  const { error } = await serviceClient
    .from('user_organizations')
    .update({ role: newRole } as never)
    .eq('user_id', targetUserId)
    .eq('organization_id', auth.organizationId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function removeUser(targetUserId: string): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };

  if (targetUserId === auth.userId) {
    return { success: false, error: 'Cannot remove yourself from the organization' };
  }

  const serviceClient = await createServiceClient();

  // Check caller is admin
  const { data: myOrg } = await serviceClient
    .from('user_organizations')
    .select('role')
    .eq('user_id', auth.userId)
    .eq('organization_id', auth.organizationId)
    .single();

  if (!myOrg || (myOrg as { role: string }).role !== 'admin') {
    return { success: false, error: 'Only admins can remove users' };
  }

  const { error } = await serviceClient
    .from('user_organizations')
    .delete()
    .eq('user_id', targetUserId)
    .eq('organization_id', auth.organizationId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// ---- Current User Role ----

export async function getCurrentUserRole(): Promise<ActionResult<'admin' | 'member'>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const serviceClient = await createServiceClient();

  const { data } = await serviceClient
    .from('user_organizations')
    .select('role')
    .eq('user_id', auth.userId)
    .eq('organization_id', auth.organizationId)
    .single();

  if (!data) return { success: false, error: 'No membership found' };
  return { success: true, data: (data as { role: string }).role as 'admin' | 'member' };
}

// ---- Organization Settings (association visibility, status customization) ----

export async function getOrgSetting(settingKey: string): Promise<ActionResult<unknown>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('org_settings')
    .select('setting_value')
    .eq('organization_id', auth.organizationId)
    .eq('setting_key', settingKey)
    .single();

  if (error && error.code !== 'PGRST116') return { success: false, error: error.message };
  return { success: true, data: data ? (data as { setting_value: unknown }).setting_value : null };
}

export async function saveOrgSetting(settingKey: string, settingValue: unknown): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await supabase
    .from('org_settings')
    .upsert({
      organization_id: auth.organizationId,
      setting_key: settingKey,
      setting_value: settingValue,
    } as never, { onConflict: 'organization_id,setting_key' });

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// ---- Notifications ----

export interface NotificationItem {
  id: string;
  message: string;
  recordId: string;
  recordType: string;
  read: boolean;
  createdAt: string;
}

export async function listNotifications(
  limit: number = 20
): Promise<ActionResult<{ items: NotificationItem[]; unreadCount: number }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { success: false, error: error.message };

  const items = (data ?? []).map((n: Record<string, unknown>) => ({
    id: n.id as string,
    message: n.message as string,
    recordId: n.record_id as string,
    recordType: n.record_type as string,
    read: n.read as boolean,
    createdAt: n.created_at as string,
  }));

  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.userId)
    .eq('read', false);

  return {
    success: true,
    data: { items, unreadCount: count ?? 0 },
  };
}

export async function markNotificationRead(notificationId: string): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  await supabase
    .from('notifications')
    .update({ read: true } as never)
    .eq('id', notificationId);

  return { success: true, data: null };
}

export async function markAllNotificationsRead(): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  await supabase
    .from('notifications')
    .update({ read: true } as never)
    .eq('user_id', auth.userId)
    .eq('read', false);

  return { success: true, data: null };
}
