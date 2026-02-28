'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import type { ActionResult } from '@/types/actions';

export interface FunctionChartFunction {
  id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  subfunctions: FunctionChartSubfunction[];
}

export interface FunctionChartSubfunction {
  id: string;
  title: string;
  description: string | null;
  status: string;
  function_id: string;
  position: number;
  people: { id: string; first_name: string; last_name: string }[];
  roles: { id: string; title: string }[];
  software: { id: string; title: string }[];
}

export interface FunctionDetailCoreActivity {
  id: string;
  title: string;
  description: string | null;
  status: string;
  subfunction_id: string | null;
  position: number;
  people: { id: string; first_name: string; last_name: string }[];
  roles: { id: string; title: string }[];
  software: { id: string; title: string }[];
}

export async function getFunctionChartData(): Promise<
  ActionResult<{ orgName: string; functions: FunctionChartFunction[] }>
> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // Fetch organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', auth.organizationId)
    .single();
  const orgName = org?.name || '';

  // Fetch all functions
  const { data: functions, error: funcError } = await supabase
    .from('functions')
    .select('id, title, description, status, created_at')
    .order('created_at', { ascending: true });

  if (funcError) return { success: false, error: funcError.message };
  if (!functions?.length) return { success: true, data: { orgName, functions: [] } };

  // Fetch all subfunctions
  const { data: subfunctions, error: subError } = await supabase
    .from('subfunctions')
    .select('id, title, description, status, function_id, position')
    .order('position', { ascending: true });

  if (subError) return { success: false, error: subError.message };

  // Fetch associations for all subfunctions in batch
  const subIds = (subfunctions || []).map((s) => s.id);

  const [peopleRes, rolesRes, softwareRes] = await Promise.all([
    subIds.length
      ? supabase
          .from('subfunction_people')
          .select('subfunction_id, person_id')
          .in('subfunction_id', subIds)
      : { data: [], error: null },
    subIds.length
      ? supabase
          .from('subfunction_roles')
          .select('subfunction_id, role_id')
          .in('subfunction_id', subIds)
      : { data: [], error: null },
    subIds.length
      ? supabase
          .from('subfunction_software')
          .select('subfunction_id, software_id')
          .in('subfunction_id', subIds)
      : { data: [], error: null },
  ]);

  // Fetch actual person/role/software records
  const personIds = [...new Set((peopleRes.data || []).map((p) => (p as Record<string, string>).person_id))];
  const roleIds = [...new Set((rolesRes.data || []).map((r) => (r as Record<string, string>).role_id))];
  const softwareIds = [...new Set((softwareRes.data || []).map((s) => (s as Record<string, string>).software_id))];

  const [personsRes, rolesDataRes, softwareDataRes] = await Promise.all([
    personIds.length
      ? supabase.from('persons').select('id, first_name, last_name').in('id', personIds)
      : { data: [], error: null },
    roleIds.length
      ? supabase.from('roles').select('id, title').in('id', roleIds)
      : { data: [], error: null },
    softwareIds.length
      ? supabase.from('software').select('id, title').in('id', softwareIds)
      : { data: [], error: null },
  ]);

  const personsMap = new Map((personsRes.data || []).map((p) => [p.id, p]));
  const rolesMap = new Map((rolesDataRes.data || []).map((r) => [r.id, r]));
  const softwareMap = new Map((softwareDataRes.data || []).map((s) => [s.id, s]));

  // Build subfunction association maps
  const subPeopleMap = new Map<string, { id: string; first_name: string; last_name: string }[]>();
  const subRolesMap = new Map<string, { id: string; title: string }[]>();
  const subSoftwareMap = new Map<string, { id: string; title: string }[]>();

  for (const jp of (peopleRes.data || []) as { subfunction_id: string; person_id: string }[]) {
    const person = personsMap.get(jp.person_id);
    if (person) {
      const list = subPeopleMap.get(jp.subfunction_id) || [];
      list.push(person as { id: string; first_name: string; last_name: string });
      subPeopleMap.set(jp.subfunction_id, list);
    }
  }

  for (const jr of (rolesRes.data || []) as { subfunction_id: string; role_id: string }[]) {
    const role = rolesMap.get(jr.role_id);
    if (role) {
      const list = subRolesMap.get(jr.subfunction_id) || [];
      list.push(role as { id: string; title: string });
      subRolesMap.set(jr.subfunction_id, list);
    }
  }

  for (const js of (softwareRes.data || []) as { subfunction_id: string; software_id: string }[]) {
    const sw = softwareMap.get(js.software_id);
    if (sw) {
      const list = subSoftwareMap.get(js.subfunction_id) || [];
      list.push(sw as { id: string; title: string });
      subSoftwareMap.set(js.subfunction_id, list);
    }
  }

  // Assemble result
  const chartFunctions: FunctionChartFunction[] = functions.map((fn) => ({
    id: fn.id,
    title: fn.title,
    description: fn.description,
    status: fn.status,
    position: 0,
    subfunctions: (subfunctions || [])
      .filter((sf) => sf.function_id === fn.id)
      .map((sf) => ({
        id: sf.id,
        title: sf.title,
        description: sf.description,
        status: sf.status,
        function_id: sf.function_id,
        position: sf.position,
        people: subPeopleMap.get(sf.id) || [],
        roles: subRolesMap.get(sf.id) || [],
        software: subSoftwareMap.get(sf.id) || [],
      })),
  }));

  return { success: true, data: { orgName, functions: chartFunctions } };
}

export async function getFunctionDetailData(
  functionId: string
): Promise<
  ActionResult<{
    func: { id: string; title: string; description: string | null; status: string };
    subfunctions: {
      id: string;
      title: string;
      description: string | null;
      status: string;
      position: number;
      people: { id: string; first_name: string; last_name: string }[];
      roles: { id: string; title: string }[];
      software: { id: string; title: string }[];
      coreActivities: FunctionDetailCoreActivity[];
    }[];
  }>
> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // Fetch function
  const { data: func, error: funcError } = await supabase
    .from('functions')
    .select('id, title, description, status')
    .eq('id', functionId)
    .single();

  if (funcError) return { success: false, error: funcError.message };

  // Fetch subfunctions for this function
  const { data: subfunctions, error: subError } = await supabase
    .from('subfunctions')
    .select('id, title, description, status, position')
    .eq('function_id', functionId)
    .order('position', { ascending: true });

  if (subError) return { success: false, error: subError.message };

  // Fetch core activities for all subfunctions
  const subIds = (subfunctions || []).map((s) => s.id);

  // Fetch subfunction-level associations in parallel with core activities
  const [caResult, subPeopleRes, subRolesRes, subSoftwareRes] = await Promise.all([
    subIds.length
      ? supabase
          .from('core_activities')
          .select('id, title, description, status, subfunction_id, position')
          .in('subfunction_id', subIds)
          .order('position', { ascending: true })
      : Promise.resolve({ data: [] as { id: string; title: string; description: string | null; status: string; subfunction_id: string | null; position: number }[], error: null }),
    subIds.length
      ? supabase.from('subfunction_people').select('subfunction_id, person_id').in('subfunction_id', subIds)
      : Promise.resolve({ data: [] as { subfunction_id: string; person_id: string }[], error: null }),
    subIds.length
      ? supabase.from('subfunction_roles').select('subfunction_id, role_id').in('subfunction_id', subIds)
      : Promise.resolve({ data: [] as { subfunction_id: string; role_id: string }[], error: null }),
    subIds.length
      ? supabase.from('subfunction_software').select('subfunction_id, software_id').in('subfunction_id', subIds)
      : Promise.resolve({ data: [] as { subfunction_id: string; software_id: string }[], error: null }),
  ]);

  const coreActivities = caResult.data || [];
  if (caResult.error) return { success: false, error: caResult.error.message };

  // Fetch associations for core activities
  const caIds = coreActivities.map((ca) => ca.id);

  const [caPeopleRes, caRolesRes, caSoftwareRes] = await Promise.all([
    caIds.length
      ? supabase.from('core_activity_people').select('core_activity_id, person_id').in('core_activity_id', caIds)
      : { data: [], error: null },
    caIds.length
      ? supabase.from('core_activity_roles').select('core_activity_id, role_id').in('core_activity_id', caIds)
      : { data: [], error: null },
    caIds.length
      ? supabase.from('core_activity_software').select('core_activity_id, software_id').in('core_activity_id', caIds)
      : { data: [], error: null },
  ]);

  // Collect all person/role/software IDs from both CA and subfunction associations
  const subPersonIds = [...new Set((subPeopleRes.data || []).map((p) => (p as Record<string, string>).person_id))];
  const subRoleIds = [...new Set((subRolesRes.data || []).map((r) => (r as Record<string, string>).role_id))];
  const subSoftwareIds = [...new Set((subSoftwareRes.data || []).map((s) => (s as Record<string, string>).software_id))];

  const caPersonIds = [...new Set((caPeopleRes.data || []).map((p) => (p as Record<string, string>).person_id))];
  const caRoleIds = [...new Set((caRolesRes.data || []).map((r) => (r as Record<string, string>).role_id))];
  const caSoftwareIds = [...new Set((caSoftwareRes.data || []).map((s) => (s as Record<string, string>).software_id))];

  const allPersonIds = [...new Set([...subPersonIds, ...caPersonIds])];
  const allRoleIds = [...new Set([...subRoleIds, ...caRoleIds])];
  const allSoftwareIds = [...new Set([...subSoftwareIds, ...caSoftwareIds])];

  const [personsRes, rolesDataRes, softwareDataRes] = await Promise.all([
    allPersonIds.length ? supabase.from('persons').select('id, first_name, last_name').in('id', allPersonIds) : { data: [], error: null },
    allRoleIds.length ? supabase.from('roles').select('id, title').in('id', allRoleIds) : { data: [], error: null },
    allSoftwareIds.length ? supabase.from('software').select('id, title').in('id', allSoftwareIds) : { data: [], error: null },
  ]);

  const personsMap = new Map((personsRes.data || []).map((p) => [p.id, p]));
  const rolesMap = new Map((rolesDataRes.data || []).map((r) => [r.id, r]));
  const softwareMap = new Map((softwareDataRes.data || []).map((s) => [s.id, s]));

  // Build subfunction association maps
  const sfPeopleMap = new Map<string, { id: string; first_name: string; last_name: string }[]>();
  const sfRolesMap = new Map<string, { id: string; title: string }[]>();
  const sfSoftwareMap = new Map<string, { id: string; title: string }[]>();

  for (const jp of (subPeopleRes.data || []) as { subfunction_id: string; person_id: string }[]) {
    const person = personsMap.get(jp.person_id);
    if (person) {
      const list = sfPeopleMap.get(jp.subfunction_id) || [];
      list.push(person as { id: string; first_name: string; last_name: string });
      sfPeopleMap.set(jp.subfunction_id, list);
    }
  }

  for (const jr of (subRolesRes.data || []) as { subfunction_id: string; role_id: string }[]) {
    const role = rolesMap.get(jr.role_id);
    if (role) {
      const list = sfRolesMap.get(jr.subfunction_id) || [];
      list.push(role as { id: string; title: string });
      sfRolesMap.set(jr.subfunction_id, list);
    }
  }

  for (const js of (subSoftwareRes.data || []) as { subfunction_id: string; software_id: string }[]) {
    const sw = softwareMap.get(js.software_id);
    if (sw) {
      const list = sfSoftwareMap.get(js.subfunction_id) || [];
      list.push(sw as { id: string; title: string });
      sfSoftwareMap.set(js.subfunction_id, list);
    }
  }

  // Build core activity association maps
  const caPeopleMap = new Map<string, { id: string; first_name: string; last_name: string }[]>();
  const caRolesMap = new Map<string, { id: string; title: string }[]>();
  const caSoftwareMap = new Map<string, { id: string; title: string }[]>();

  for (const jp of (caPeopleRes.data || []) as { core_activity_id: string; person_id: string }[]) {
    const person = personsMap.get(jp.person_id);
    if (person) {
      const list = caPeopleMap.get(jp.core_activity_id) || [];
      list.push(person as { id: string; first_name: string; last_name: string });
      caPeopleMap.set(jp.core_activity_id, list);
    }
  }

  for (const jr of (caRolesRes.data || []) as { core_activity_id: string; role_id: string }[]) {
    const role = rolesMap.get(jr.role_id);
    if (role) {
      const list = caRolesMap.get(jr.core_activity_id) || [];
      list.push(role as { id: string; title: string });
      caRolesMap.set(jr.core_activity_id, list);
    }
  }

  for (const js of (caSoftwareRes.data || []) as { core_activity_id: string; software_id: string }[]) {
    const sw = softwareMap.get(js.software_id);
    if (sw) {
      const list = caSoftwareMap.get(js.core_activity_id) || [];
      list.push(sw as { id: string; title: string });
      caSoftwareMap.set(js.core_activity_id, list);
    }
  }

  return {
    success: true,
    data: {
      func,
      subfunctions: (subfunctions || []).map((sf) => ({
        id: sf.id,
        title: sf.title,
        description: sf.description,
        status: sf.status,
        position: sf.position,
        people: sfPeopleMap.get(sf.id) || [],
        roles: sfRolesMap.get(sf.id) || [],
        software: sfSoftwareMap.get(sf.id) || [],
        coreActivities: (coreActivities || [])
          .filter((ca) => ca.subfunction_id === sf.id)
          .map((ca) => ({
            id: ca.id,
            title: ca.title,
            description: ca.description,
            status: ca.status,
            subfunction_id: ca.subfunction_id,
            position: ca.position,
            people: caPeopleMap.get(ca.id) || [],
            roles: caRolesMap.get(ca.id) || [],
            software: caSoftwareMap.get(ca.id) || [],
          })),
      })),
    },
  };
}

export async function reorderSubfunctions(
  updates: { id: string; position: number }[]
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  for (const update of updates) {
    const { error } = await supabase
      .from('subfunctions')
      .update({ position: update.position, updated_by: userId })
      .eq('id', update.id);
    if (error) return { success: false, error: error.message };
  }

  return { success: true, data: null };
}

export async function reorderCoreActivities(
  updates: { id: string; position: number; subfunction_id?: string }[]
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  for (const update of updates) {
    const updateData: Record<string, unknown> = { position: update.position, updated_by: userId };
    if (update.subfunction_id !== undefined) {
      updateData.subfunction_id = update.subfunction_id;
    }
    const { error } = await supabase
      .from('core_activities')
      .update(updateData)
      .eq('id', update.id);
    if (error) return { success: false, error: error.message };
  }

  return { success: true, data: null };
}

export async function addSubfunctionAssociation(
  subfunctionId: string,
  targetType: 'person' | 'role' | 'software',
  targetId: string
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  const tableMap: Record<string, string> = {
    person: 'subfunction_people',
    role: 'subfunction_roles',
    software: 'subfunction_software',
  };
  const colMap: Record<string, string> = {
    person: 'person_id',
    role: 'role_id',
    software: 'software_id',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from(tableMap[targetType])
    .upsert(
      {
        subfunction_id: subfunctionId,
        [colMap[targetType]]: targetId,
        created_by: userId,
        created_at: new Date().toISOString(),
      },
      { onConflict: `subfunction_id,${colMap[targetType]}` }
    );

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}
