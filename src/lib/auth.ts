import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AuthContext {
  userId: string;
  organizationId: string;
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userOrg } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!userOrg) {
    redirect('/login');
  }

  return {
    userId: user.id,
    organizationId: userOrg.organization_id,
  };
}
