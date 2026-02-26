import { createClient, createServiceClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export const ACTIVE_ORG_COOKIE = 'ops-map-active-org';

export interface AuthContext {
  userId: string;
  organizationId: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Get the authenticated user's context.
 * Respects the active workspace cookie if set, falling back to the first org.
 * Throws AuthError if not authenticated — callers should catch this
 * and return an error result instead of letting it propagate.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthError('Not authenticated');
  }

  // Use the service role client for the org lookup to bypass RLS.
  const serviceClient = await createServiceClient();

  // Check for active workspace cookie
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  if (activeOrgId) {
    // Verify user still belongs to this org
    const { data: membership } = await serviceClient
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', activeOrgId)
      .single();

    if (membership) {
      return {
        userId: user.id,
        organizationId: membership.organization_id,
      };
    }
    // Cookie references an org user doesn't belong to — fall through to default
  }

  // Fall back to first org
  const { data: userOrg } = await serviceClient
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!userOrg) {
    throw new AuthError('No organization found');
  }

  return {
    userId: user.id,
    organizationId: userOrg.organization_id,
  };
}

/**
 * Safe version for server actions — returns null instead of throwing.
 * Use this in 'use server' functions to avoid redirect loops.
 */
export async function getAuthContextSafe(): Promise<AuthContext | null> {
  try {
    return await getAuthContext();
  } catch (e) {
    if (e instanceof AuthError) {
      console.error('[auth] getAuthContextSafe failed:', e.message);
      return null;
    }
    throw e;
  }
}
