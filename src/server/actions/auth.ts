'use server';

import { createServiceClient, createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types/actions';

export async function signUpUser(
  email: string,
  password: string,
  orgName: string
): Promise<ActionResult<null>> {
  const serviceClient = await createServiceClient();

  // Create user with admin API (auto-confirms email, no email sent)
  const { data: authData, error: signUpError } =
    await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (signUpError) {
    return { success: false, error: signUpError.message };
  }

  if (!authData.user) {
    return { success: false, error: 'Signup failed. Please try again.' };
  }

  // Create organization
  const { data: org, error: orgError } = await serviceClient
    .from('organizations')
    .insert({ name: orgName } as never)
    .select('id')
    .single();

  if (orgError) {
    return { success: false, error: orgError.message };
  }

  // Link user to organization as admin
  const { error: linkError } = await serviceClient
    .from('user_organizations')
    .insert({
      user_id: authData.user.id,
      organization_id: org.id,
      role: 'admin',
    } as never);

  if (linkError) {
    return { success: false, error: linkError.message };
  }

  // Sign the user in so they get a session
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { success: false, error: signInError.message };
  }

  return { success: true, data: null };
}
