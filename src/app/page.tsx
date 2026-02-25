import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userOrg } = await supabase
    .from('user_organizations')
    .select('organization_id, role, organizations(name)')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Ops Map</h1>
      <div className="text-center text-muted-foreground">
        <p>
          Signed in as <strong>{user.email}</strong>
        </p>
        {userOrg && (
          <p>
            Organization:{' '}
            <strong>
              {(userOrg.organizations as { name: string } | null)?.name ?? 'Unknown'}
            </strong>{' '}
            ({userOrg.role})
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Dashboard UI will be built in Phase 2.
      </p>
      <LogoutButton />
    </div>
  );
}
