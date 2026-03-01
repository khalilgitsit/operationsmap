import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if the user has an organization — if not, create one (first-time OAuth users)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const serviceClient = await createServiceClient();
        const { data: orgs } = await serviceClient
          .from('user_organizations')
          .select('organization_id, status')
          .eq('user_id', user.id);

        if (!orgs || orgs.length === 0) {
          // No org memberships at all — create a default org (first-time OAuth users)
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
          const email = user.email || '';
          const orgName = fullName
            ? `${fullName}'s Organization`
            : `${email.split('@')[0]}'s Organization`;

          const { data: org, error: orgError } = await serviceClient
            .from('organizations')
            .insert({ name: orgName } as never)
            .select('id')
            .single();

          if (!orgError && org) {
            await serviceClient
              .from('user_organizations')
              .insert({
                user_id: user.id,
                organization_id: org.id,
                role: 'admin',
                status: 'active',
              } as never);
          }
        } else {
          // Activate any pending memberships (user accepted invite)
          await serviceClient
            .from('user_organizations')
            .update({ status: 'active' } as never)
            .eq('user_id', user.id)
            .eq('status', 'pending' as never);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
