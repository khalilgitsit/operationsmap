'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import type { ActionResult } from '@/types/actions';

// ---- Profile ----

export interface UserProfile {
  id: string;
  display_name: string | null;
  timezone: string;
  location: string | null;
  avatar_url: string | null;
  email: string;
}

export async function getProfile(): Promise<ActionResult<UserProfile>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const serviceClient = await createServiceClient();

  // Get user email
  const { data: { user } } = await serviceClient.auth.admin.getUserById(auth.userId);
  if (!user) return { success: false, error: 'User not found' };

  // Get or create profile
  const supabase = await createClient();
  let { data: profile } = await supabase
    .from('profiles' as never)
    .select('*')
    .eq('id', auth.userId)
    .single();

  if (!profile) {
    // Auto-create profile on first access
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles' as never)
      .insert({ id: auth.userId } as never)
      .select()
      .single();

    if (insertError) {
      // May fail due to RLS timing - use service client as fallback
      const { data: svcProfile } = await serviceClient
        .from('profiles' as never)
        .insert({ id: auth.userId } as never)
        .select()
        .single();
      profile = svcProfile;
    } else {
      profile = newProfile;
    }
  }

  const p = profile as Record<string, unknown> | null;

  return {
    success: true,
    data: {
      id: auth.userId,
      display_name: (p?.display_name as string) ?? null,
      timezone: (p?.timezone as string) ?? 'UTC',
      location: (p?.location as string) ?? null,
      avatar_url: (p?.avatar_url as string) ?? null,
      email: user.email ?? '',
    },
  };
}

export async function updateProfile(
  updates: Partial<Pick<UserProfile, 'display_name' | 'timezone' | 'location' | 'avatar_url'>>
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles' as never)
    .update(updates as never)
    .eq('id', auth.userId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// ---- Security ----

export async function changePassword(
  newPassword: string
): Promise<ActionResult<null>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: error.message };

  return { success: true, data: null };
}

export async function changeEmail(
  newEmail: string
): Promise<ActionResult<null>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) return { success: false, error: error.message };

  return { success: true, data: null };
}

// ---- Avatar Upload ----

export async function getAvatarUploadUrl(
  fileName: string
): Promise<ActionResult<{ path: string; publicUrl: string }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };

  // Return the path info so client can upload directly
  const path = `${auth.userId}/${fileName}`;
  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;

  return { success: true, data: { path, publicUrl } };
}

// ---- Workspace ----

export interface Workspace {
  id: string;
  name: string;
  role: string;
}

export async function listWorkspaces(): Promise<ActionResult<Workspace[]>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const serviceClient = await createServiceClient();

  // Get all orgs the user belongs to
  const { data: userOrgs, error } = await serviceClient
    .from('user_organizations')
    .select('organization_id, role')
    .eq('user_id', auth.userId);

  if (error) return { success: false, error: error.message };

  const workspaces: Workspace[] = [];
  for (const uo of (userOrgs || []) as { organization_id: string; role: string }[]) {
    const { data: org } = await serviceClient
      .from('organizations')
      .select('id, name')
      .eq('id', uo.organization_id)
      .single();

    if (org) {
      workspaces.push({
        id: (org as { id: string }).id,
        name: (org as { name: string }).name,
        role: uo.role,
      });
    }
  }

  return { success: true, data: workspaces };
}

export async function createWorkspace(name: string): Promise<ActionResult<{ id: string }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const serviceClient = await createServiceClient();

  // Create organization
  const { data: org, error: orgError } = await serviceClient
    .from('organizations')
    .insert({ name } as never)
    .select('id')
    .single();

  if (orgError) return { success: false, error: orgError.message };
  const orgId = (org as { id: string }).id;

  // Add user as admin
  const { error: linkError } = await serviceClient
    .from('user_organizations')
    .insert({
      user_id: auth.userId,
      organization_id: orgId,
      role: 'admin',
    } as never);

  if (linkError) return { success: false, error: linkError.message };

  return { success: true, data: { id: orgId } };
}

export async function switchWorkspace(organizationId: string): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };

  const serviceClient = await createServiceClient();

  // Verify user belongs to this org
  const { data: membership } = await serviceClient
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', auth.userId)
    .eq('organization_id', organizationId)
    .single();

  if (!membership) {
    return { success: false, error: 'You do not belong to this workspace' };
  }

  // Set active workspace cookie - handled client-side
  return { success: true, data: null };
}
