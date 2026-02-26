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
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);

        if (!orgs || orgs.length === 0) {
          // Derive org name from user metadata or email
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
          const email = user.email || '';
          const orgName = fullName
            ? `${fullName}'s Organization`
            : `${email.split('@')[0]}'s Organization`;

          // Create organization
          const { data: org, error: orgError } = await serviceClient
            .from('organizations')
            .insert({ name: orgName } as never)
            .select('id')
            .single();

          if (!orgError && org) {
            // Link user to organization as admin
            await serviceClient
              .from('user_organizations')
              .insert({
                user_id: user.id,
                organization_id: org.id,
                role: 'admin',
              } as never);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
