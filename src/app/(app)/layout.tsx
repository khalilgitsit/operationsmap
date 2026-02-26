import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';
import { ACTIVE_ORG_COOKIE } from '@/lib/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile data for avatar and display name
  const serviceClient = await createServiceClient();
  const { data: profile } = await serviceClient
    .from('profiles' as never)
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single();

  const p = profile as { display_name: string | null; avatar_url: string | null } | null;

  // Get active org ID
  const cookieStore = await cookies();
  const activeOrgCookie = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  // If no cookie, get the user's first org
  let activeOrgId = activeOrgCookie;
  if (!activeOrgId) {
    const { data: userOrg } = await serviceClient
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    activeOrgId = (userOrg as { organization_id: string } | null)?.organization_id;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen flex-col">
        <TopBar
          userEmail={user.email ?? ''}
          displayName={p?.display_name}
          avatarUrl={p?.avatar_url}
          activeOrgId={activeOrgId}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
