'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import type { ActionResult } from '@/types/actions';

interface BenefitOption {
  id: string;
  label: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(supabase: any, table: string): any {
  return supabase.from(table);
}

export async function listBenefitOptions(): Promise<ActionResult<BenefitOption[]>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data, error } = await fromTable(supabase, 'benefit_options')
    .select('id, label')
    .eq('organization_id', auth.organizationId)
    .order('label', { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as BenefitOption[] };
}

export async function getPersonBenefits(personId: string): Promise<ActionResult<BenefitOption[]>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data, error } = await fromTable(supabase, 'person_benefits')
    .select('benefit_option_id, benefit_options(id, label)')
    .eq('person_id', personId);

  if (error) return { success: false, error: error.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const benefits: BenefitOption[] = (data ?? []).map((row: any) => ({
    id: row.benefit_options.id,
    label: row.benefit_options.label,
  }));

  return { success: true, data: benefits };
}

export async function addPersonBenefit(
  personId: string,
  benefitOptionId: string
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await fromTable(supabase, 'person_benefits')
    .insert({
      person_id: personId,
      benefit_option_id: benefitOptionId,
      created_by: auth.userId,
    });

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function removePersonBenefit(
  personId: string,
  benefitOptionId: string
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await fromTable(supabase, 'person_benefits')
    .delete()
    .eq('person_id', personId)
    .eq('benefit_option_id', benefitOptionId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function createBenefitOption(label: string): Promise<ActionResult<BenefitOption>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data, error } = await fromTable(supabase, 'benefit_options')
    .insert({
      organization_id: auth.organizationId,
      label,
      created_by: auth.userId,
    })
    .select('id, label')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as BenefitOption };
}

export async function seedDefaultBenefits(): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const defaults = [
    'Health Insurance',
    'Dental',
    'Vision',
    '401(k)',
    'PTO',
    'Remote Work Stipend',
  ];

  // Check if org already has benefits
  const { data: existing } = await fromTable(supabase, 'benefit_options')
    .select('id')
    .eq('organization_id', auth.organizationId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: true, data: null };
  }

  const rows = defaults.map((label) => ({
    organization_id: auth.organizationId,
    label,
    created_by: auth.userId,
  }));

  const { error } = await fromTable(supabase, 'benefit_options')
    .insert(rows);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}
