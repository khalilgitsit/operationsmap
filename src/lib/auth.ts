import { createClient, createServiceClient } from '@/lib/supabase/server';

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
  // The user's JWT may have been refreshed by getUser() but the new token
  // may not be available for PostgREST queries in the same request cycle.
  const serviceClient = await createServiceClient();
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
