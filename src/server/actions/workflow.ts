'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import type { ActionResult } from '@/types/actions';

// Types for the workflow map data

export interface WorkflowMapCoreActivity {
  id: string;
  title: string;
  description: string | null;
  status: string;
  subfunction_id: string | null;
  people: { id: string; first_name: string; last_name: string }[];
  roles: { id: string; title: string }[];
  software: { id: string; title: string }[];
}

export interface WorkflowMapProcess {
  id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  coreActivities: WorkflowMapCoreActivity[];
}

export interface WorkflowMapHandoff {
  id: string;
  label: string;
  from_phase_id: string | null;
  to_phase_id: string | null;
  position: number;
}

export interface WorkflowMapPhase {
  id: string;
  title: string;
  description: string | null;
  status: string;
  position: number;
  processes: WorkflowMapProcess[];
  handoffs: WorkflowMapHandoff[];
}

export interface WorkflowMapData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  phases: WorkflowMapPhase[];
}

// Batch-fetch all data for a workflow map
export async function getWorkflowMapData(
  workflowId: string
): Promise<ActionResult<WorkflowMapData>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // Fetch workflow
  const { data: workflow, error: wfError } = await supabase
    .from('workflows')
    .select('id, title, description, status')
    .eq('id', workflowId)
    .single();

  if (wfError) return { success: false, error: wfError.message };

  // Fetch phases
  const { data: phases, error: phError } = await supabase
    .from('workflow_phases')
    .select('id, title, description, status, position')
    .eq('workflow_id', workflowId)
    .order('position', { ascending: true });

  if (phError) return { success: false, error: phError.message };

  // Fetch handoff blocks
  const { data: handoffs, error: hError } = await supabase
    .from('handoff_blocks')
    .select('id, label, from_phase_id, to_phase_id, position')
    .eq('workflow_id', workflowId)
    .order('position', { ascending: true });

  if (hError) return { success: false, error: hError.message };

  const phaseIds = (phases || []).map((p) => p.id);

  // Fetch phase-process junction
  const { data: phaseProcesses, error: ppError } = phaseIds.length
    ? await supabase
        .from('workflow_phase_processes')
        .select('phase_id, process_id, position')
        .in('phase_id', phaseIds)
        .order('position', { ascending: true })
    : { data: [] as { phase_id: string; process_id: string; position: number }[], error: null };

  if (ppError) return { success: false, error: ppError.message };

  const processIds = [...new Set((phaseProcesses || []).map((pp) => pp.process_id))];

  // Fetch processes
  const { data: processes, error: procError } = processIds.length
    ? await supabase
        .from('processes')
        .select('id, title, description, status')
        .in('id', processIds)
    : { data: [] as { id: string; title: string; description: string | null; status: string }[], error: null };

  if (procError) return { success: false, error: procError.message };

  // Fetch process-core_activity junction
  const { data: processCAs, error: pcaError } = processIds.length
    ? await supabase
        .from('process_core_activities')
        .select('process_id, core_activity_id, position')
        .in('process_id', processIds)
        .order('position', { ascending: true })
    : { data: [] as { process_id: string; core_activity_id: string; position: number }[], error: null };

  if (pcaError) return { success: false, error: pcaError.message };

  const caIds = [...new Set((processCAs || []).map((pca) => pca.core_activity_id))];

  // Fetch core activities
  const { data: coreActivities, error: caError } = caIds.length
    ? await supabase
        .from('core_activities')
        .select('id, title, description, status, subfunction_id')
        .in('id', caIds)
    : { data: [] as { id: string; title: string; description: string | null; status: string; subfunction_id: string | null }[], error: null };

  if (caError) return { success: false, error: caError.message };

  // Fetch associations for core activities (people, roles, software)
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

  const personIds = [...new Set((caPeopleRes.data || []).map((p) => (p as Record<string, string>).person_id))];
  const roleIds = [...new Set((caRolesRes.data || []).map((r) => (r as Record<string, string>).role_id))];
  const softwareIds = [...new Set((caSoftwareRes.data || []).map((s) => (s as Record<string, string>).software_id))];

  const [personsRes, rolesDataRes, softwareDataRes] = await Promise.all([
    personIds.length ? supabase.from('persons').select('id, first_name, last_name').in('id', personIds) : { data: [], error: null },
    roleIds.length ? supabase.from('roles').select('id, title').in('id', roleIds) : { data: [], error: null },
    softwareIds.length ? supabase.from('software').select('id, title').in('id', softwareIds) : { data: [], error: null },
  ]);

  const personsMap = new Map((personsRes.data || []).map((p) => [p.id, p]));
  const rolesMap = new Map((rolesDataRes.data || []).map((r) => [r.id, r]));
  const softwareMap = new Map((softwareDataRes.data || []).map((s) => [s.id, s]));

  // Build CA association maps
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

  // Build CA map
  const caMap = new Map(
    (coreActivities || []).map((ca) => [
      ca.id,
      {
        id: ca.id,
        title: ca.title,
        description: ca.description,
        status: ca.status,
        subfunction_id: ca.subfunction_id,
        people: caPeopleMap.get(ca.id) || [],
        roles: caRolesMap.get(ca.id) || [],
        software: caSoftwareMap.get(ca.id) || [],
      },
    ])
  );

  // Build process map with ordered CAs
  const processMap = new Map(
    (processes || []).map((proc) => [proc.id, proc])
  );

  // Build phase-process-CAs structure
  const phaseProcessMap = new Map<string, WorkflowMapProcess[]>();
  for (const pp of phaseProcesses || []) {
    const proc = processMap.get(pp.process_id);
    if (!proc) continue;
    const list = phaseProcessMap.get(pp.phase_id) || [];
    const procCAs = (processCAs || [])
      .filter((pca) => pca.process_id === pp.process_id)
      .sort((a, b) => a.position - b.position)
      .map((pca) => caMap.get(pca.core_activity_id))
      .filter(Boolean) as WorkflowMapCoreActivity[];

    list.push({
      id: proc.id,
      title: proc.title,
      description: proc.description,
      status: proc.status,
      position: pp.position,
      coreActivities: procCAs,
    });
    phaseProcessMap.set(pp.phase_id, list);
  }

  // Build handoff map
  const handoffMap = new Map<string, WorkflowMapHandoff[]>();
  for (const h of handoffs || []) {
    // Group by from_phase_id for display after a phase
    const key = h.from_phase_id || 'top';
    const list = handoffMap.get(key) || [];
    list.push({
      id: h.id,
      label: h.label,
      from_phase_id: h.from_phase_id,
      to_phase_id: h.to_phase_id,
      position: h.position,
    });
    handoffMap.set(key, list);
  }

  // Assemble result
  const result: WorkflowMapData = {
    id: workflow.id,
    title: workflow.title,
    description: workflow.description,
    status: workflow.status,
    phases: (phases || []).map((phase) => ({
      id: phase.id,
      title: phase.title,
      description: phase.description,
      status: phase.status,
      position: phase.position,
      processes: (phaseProcessMap.get(phase.id) || []).sort((a, b) => a.position - b.position),
      handoffs: handoffMap.get(phase.id) || [],
    })),
  };

  return { success: true, data: result };
}

// Create a new workflow
export async function createWorkflow(
  title: string,
  description?: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('workflows')
    .insert({
      title,
      description: description || null,
      organization_id: organizationId,
      created_by: userId,
      updated_by: userId,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: data.id } };
}

// Update workflow title/description/status
export async function updateWorkflow(
  workflowId: string,
  updates: { title?: string; description?: string; status?: 'Draft' | 'Active' | 'Archived' }
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  const { error } = await supabase
    .from('workflows')
    .update({ ...updates, updated_by: userId })
    .eq('id', workflowId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// Delete a workflow
export async function deleteWorkflow(
  workflowId: string
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', workflowId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// Create a new phase
export async function createPhase(
  workflowId: string,
  position: number,
  title?: string
): Promise<ActionResult<{ id: string }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('workflow_phases')
    .insert({
      workflow_id: workflowId,
      title: title || `Phase ${position + 1}`,
      position,
      status: 'Draft',
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: data.id } };
}

// Update a phase
export async function updatePhase(
  phaseId: string,
  updates: { title?: string; description?: string; status?: 'Draft' | 'In Review' | 'Active' | 'Needs Update' | 'Archived' }
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await supabase
    .from('workflow_phases')
    .update(updates)
    .eq('id', phaseId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// Delete a phase
export async function deletePhase(
  phaseId: string
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await supabase
    .from('workflow_phases')
    .delete()
    .eq('id', phaseId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// Reorder phases
export async function reorderPhases(
  updates: { id: string; position: number }[]
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  for (const update of updates) {
    const { error } = await supabase
      .from('workflow_phases')
      .update({ position: update.position })
      .eq('id', update.id);
    if (error) return { success: false, error: error.message };
  }

  return { success: true, data: null };
}

// Add an existing process to a phase
export async function addProcessToPhase(
  phaseId: string,
  processId: string,
  position: number
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('workflow_phase_processes')
    .upsert(
      {
        phase_id: phaseId,
        process_id: processId,
        position,
        created_by: userId,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'phase_id,process_id' }
    );

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// Remove a process from a phase
export async function removeProcessFromPhase(
  phaseId: string,
  processId: string
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('workflow_phase_processes')
    .delete()
    .eq('phase_id', phaseId)
    .eq('process_id', processId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// Reorder processes within a phase (or move between phases)
export async function reorderProcessesInPhase(
  updates: { phaseId: string; processId: string; position: number }[]
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  for (const update of updates) {
    // Delete old entry and insert new one (to handle phase changes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('workflow_phase_processes')
      .delete()
      .eq('process_id', update.processId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('workflow_phase_processes')
      .insert({
        phase_id: update.phaseId,
        process_id: update.processId,
        position: update.position,
        created_by: userId,
        created_at: new Date().toISOString(),
      });

    if (error) return { success: false, error: error.message };
  }

  return { success: true, data: null };
}

// Reorder core activities within a process
export async function reorderCoreActivitiesInProcess(
  updates: { processId: string; coreActivityId: string; position: number }[]
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  for (const update of updates) {
    // Delete and re-insert to handle process changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('process_core_activities')
      .delete()
      .eq('core_activity_id', update.coreActivityId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('process_core_activities')
      .insert({
        process_id: update.processId,
        core_activity_id: update.coreActivityId,
        position: update.position,
        created_by: userId,
        created_at: new Date().toISOString(),
      });

    if (error) return { success: false, error: error.message };
  }

  return { success: true, data: null };
}

// Add a core activity to a process
export async function addCoreActivityToProcess(
  processId: string,
  coreActivityId: string,
  position: number
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId } = auth;
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('process_core_activities')
    .upsert(
      {
        process_id: processId,
        core_activity_id: coreActivityId,
        position,
        created_by: userId,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'process_id,core_activity_id' }
    );

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// Remove a core activity from a process
export async function removeCoreActivityFromProcess(
  processId: string,
  coreActivityId: string
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('process_core_activities')
    .delete()
    .eq('process_id', processId)
    .eq('core_activity_id', coreActivityId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// Create a new process and add to phase
export async function createProcessInPhase(
  phaseId: string,
  title: string,
  position: number
): Promise<ActionResult<{ id: string }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  // Create process
  const { data: proc, error: procError } = await supabase
    .from('processes')
    .insert({
      title,
      status: 'Draft',
      organization_id: organizationId,
      created_by: userId,
      updated_by: userId,
    })
    .select('id')
    .single();

  if (procError) return { success: false, error: procError.message };

  // Link to phase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: linkError } = await (supabase as any)
    .from('workflow_phase_processes')
    .insert({
      phase_id: phaseId,
      process_id: proc.id,
      position,
      created_by: userId,
      created_at: new Date().toISOString(),
    });

  if (linkError) return { success: false, error: linkError.message };
  return { success: true, data: { id: proc.id } };
}

// Create a new core activity and add to process
export async function createCoreActivityInProcess(
  processId: string,
  title: string,
  position: number
): Promise<ActionResult<{ id: string }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  // Create CA
  const { data: ca, error: caError } = await supabase
    .from('core_activities')
    .insert({
      title,
      status: 'Draft',
      organization_id: organizationId,
      created_by: userId,
      updated_by: userId,
    })
    .select('id')
    .single();

  if (caError) return { success: false, error: caError.message };

  // Link to process
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: linkError } = await (supabase as any)
    .from('process_core_activities')
    .insert({
      process_id: processId,
      core_activity_id: ca.id,
      position,
      created_by: userId,
      created_at: new Date().toISOString(),
    });

  if (linkError) return { success: false, error: linkError.message };
  return { success: true, data: { id: ca.id } };
}

// Create handoff block
export async function createHandoffBlock(
  workflowId: string,
  label: string,
  fromPhaseId: string | null,
  toPhaseId: string | null,
  position: number
): Promise<ActionResult<{ id: string }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('handoff_blocks')
    .insert({
      workflow_id: workflowId,
      label,
      from_phase_id: fromPhaseId,
      to_phase_id: toPhaseId,
      position,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: { id: data.id } };
}

// Update handoff block
export async function updateHandoffBlock(
  blockId: string,
  updates: { label?: string }
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await supabase
    .from('handoff_blocks')
    .update(updates)
    .eq('id', blockId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// Delete handoff block
export async function deleteHandoffBlock(
  blockId: string
): Promise<ActionResult<null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { error } = await supabase
    .from('handoff_blocks')
    .delete()
    .eq('id', blockId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// List all workflows (for the list page)
export async function listWorkflows(): Promise<
  ActionResult<
    {
      id: string;
      title: string;
      description: string | null;
      status: string;
      created_at: string;
      updated_at: string;
      phase_count: number;
      process_count: number;
      core_activity_count: number;
    }[]
  >
> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  const { data: workflows, error: wfError } = await supabase
    .from('workflows')
    .select('id, title, description, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (wfError) return { success: false, error: wfError.message };
  if (!workflows?.length) return { success: true, data: [] };

  const wfIds = workflows.map((w) => w.id);

  // Fetch phase counts
  const { data: phases } = await supabase
    .from('workflow_phases')
    .select('id, workflow_id')
    .in('workflow_id', wfIds);

  const phaseIds = (phases || []).map((p) => p.id);

  // Fetch process counts
  const { data: phaseProcesses } = phaseIds.length
    ? await supabase
        .from('workflow_phase_processes')
        .select('phase_id, process_id')
        .in('phase_id', phaseIds)
    : { data: [] };

  // Count processes per workflow through phases
  const phaseWorkflowMap = new Map((phases || []).map((p) => [p.id, p.workflow_id]));

  // Fetch CA counts per process
  const processIds = [...new Set((phaseProcesses || []).map((pp) => (pp as Record<string, string>).process_id))];
  const { data: processCAs } = processIds.length
    ? await supabase
        .from('process_core_activities')
        .select('process_id, core_activity_id')
        .in('process_id', processIds)
    : { data: [] };

  // Build counts per workflow
  const phaseCounts = new Map<string, number>();
  const processCounts = new Map<string, number>();
  const caCounts = new Map<string, number>();

  for (const p of phases || []) {
    phaseCounts.set(p.workflow_id, (phaseCounts.get(p.workflow_id) || 0) + 1);
  }

  const processPhaseMap = new Map<string, string>();
  for (const pp of (phaseProcesses || []) as { phase_id: string; process_id: string }[]) {
    const wfId = phaseWorkflowMap.get(pp.phase_id);
    if (wfId) {
      processCounts.set(wfId, (processCounts.get(wfId) || 0) + 1);
      processPhaseMap.set(pp.process_id, wfId);
    }
  }

  for (const pca of (processCAs || []) as { process_id: string; core_activity_id: string }[]) {
    const wfId = processPhaseMap.get(pca.process_id);
    if (wfId) {
      caCounts.set(wfId, (caCounts.get(wfId) || 0) + 1);
    }
  }

  return {
    success: true,
    data: workflows.map((wf) => ({
      id: wf.id,
      title: wf.title,
      description: wf.description,
      status: wf.status,
      created_at: wf.created_at,
      updated_at: wf.updated_at,
      phase_count: phaseCounts.get(wf.id) || 0,
      process_count: processCounts.get(wf.id) || 0,
      core_activity_count: caCounts.get(wf.id) || 0,
    })),
  };
}

// --- Workflow context helpers for numbering ---

export interface ProcessWorkflowContext {
  workflowId: string;
  workflowTitle: string;
  phasePosition: number;
  processPosition: number;
  coreActivities: {
    id: string;
    title: string;
    status: string;
    position: number;
    number: string; // e.g. "1.1.1"
  }[];
}

/**
 * Get workflow context for a process — its phase/process numbering and ordered CAs.
 * Returns null if the process is not part of any workflow.
 */
export async function getProcessWorkflowContext(
  processId: string
): Promise<ActionResult<ProcessWorkflowContext | null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // Find which phase(s) this process belongs to via workflow_phase_processes
  const { data: phaseLinks, error: plError } = await supabase
    .from('workflow_phase_processes')
    .select('phase_id, position')
    .eq('process_id', processId)
    .limit(1);

  if (plError) return { success: false, error: plError.message };
  if (!phaseLinks?.length) return { success: true, data: null };

  const phaseLink = phaseLinks[0];

  // Get the phase and its workflow
  const { data: phase, error: phError } = await supabase
    .from('workflow_phases')
    .select('id, workflow_id, position')
    .eq('id', phaseLink.phase_id)
    .single();

  if (phError) return { success: false, error: phError.message };

  // Get the workflow title
  const { data: workflow, error: wfError } = await supabase
    .from('workflows')
    .select('id, title')
    .eq('id', phase.workflow_id)
    .single();

  if (wfError) return { success: false, error: wfError.message };

  // Get core activities for this process, ordered by position
  const { data: processCAs, error: pcaError } = await supabase
    .from('process_core_activities')
    .select('core_activity_id, position')
    .eq('process_id', processId)
    .order('position', { ascending: true });

  if (pcaError) return { success: false, error: pcaError.message };

  const caIds = (processCAs || []).map((pca) => pca.core_activity_id);
  let caMap = new Map<string, { id: string; title: string; status: string }>();

  if (caIds.length) {
    const { data: cas } = await supabase
      .from('core_activities')
      .select('id, title, status')
      .in('id', caIds);
    if (cas) {
      caMap = new Map(cas.map((ca) => [ca.id, ca]));
    }
  }

  const phaseNum = phase.position + 1;
  const processNum = phaseLink.position + 1;

  const coreActivities = (processCAs || []).map((pca, idx) => {
    const ca = caMap.get(pca.core_activity_id);
    return {
      id: pca.core_activity_id,
      title: ca?.title || 'Untitled',
      status: ca?.status || 'Draft',
      position: pca.position,
      number: `${phaseNum}.${processNum}.${idx + 1}`,
    };
  });

  return {
    success: true,
    data: {
      workflowId: workflow.id,
      workflowTitle: workflow.title,
      phasePosition: phase.position,
      processPosition: phaseLink.position,
      coreActivities,
    },
  };
}

export interface CoreActivityWorkflowContext {
  workflowId: string;
  workflowTitle: string;
  processId: string;
  processTitle: string;
  number: string; // e.g. "1.1.3"
}

/**
 * Get workflow context for a core activity — its positional number within a workflow.
 * Returns null if the CA is not part of any workflow.
 */
export async function getCoreActivityWorkflowContext(
  coreActivityId: string
): Promise<ActionResult<CoreActivityWorkflowContext | null>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // Find which process(es) this CA belongs to
  const { data: processLinks, error: plError } = await supabase
    .from('process_core_activities')
    .select('process_id, position')
    .eq('core_activity_id', coreActivityId)
    .limit(1);

  if (plError) return { success: false, error: plError.message };
  if (!processLinks?.length) return { success: true, data: null };

  const processLink = processLinks[0];

  // Get the process title
  const { data: process, error: procError } = await supabase
    .from('processes')
    .select('id, title')
    .eq('id', processLink.process_id)
    .single();

  if (procError) return { success: false, error: procError.message };

  // Get the CA's position index (count CAs before it)
  const { data: allCAs } = await supabase
    .from('process_core_activities')
    .select('core_activity_id, position')
    .eq('process_id', processLink.process_id)
    .order('position', { ascending: true });

  const caIndex = (allCAs || []).findIndex((ca) => ca.core_activity_id === coreActivityId);

  // Find which phase this process belongs to
  const { data: phaseLinks } = await supabase
    .from('workflow_phase_processes')
    .select('phase_id, position')
    .eq('process_id', processLink.process_id)
    .limit(1);

  if (!phaseLinks?.length) return { success: true, data: null };

  const phaseLink = phaseLinks[0];

  // Get the phase and workflow
  const { data: phase, error: phError } = await supabase
    .from('workflow_phases')
    .select('id, workflow_id, position')
    .eq('id', phaseLink.phase_id)
    .single();

  if (phError) return { success: false, error: phError.message };

  const { data: workflow, error: wfError } = await supabase
    .from('workflows')
    .select('id, title')
    .eq('id', phase.workflow_id)
    .single();

  if (wfError) return { success: false, error: wfError.message };

  const phaseNum = phase.position + 1;
  const processNum = phaseLink.position + 1;
  const caNum = caIndex + 1;

  return {
    success: true,
    data: {
      workflowId: workflow.id,
      workflowTitle: workflow.title,
      processId: process.id,
      processTitle: process.title,
      number: `${phaseNum}.${processNum}.${caNum}`,
    },
  };
}

/**
 * Get workflows that contain a given core activity (indirect via process → phase → workflow).
 */
export async function getCoreActivityWorkflows(
  coreActivityId: string
): Promise<ActionResult<{ id: string; title: string }[]>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // CA → processes
  const { data: processLinks } = await supabase
    .from('process_core_activities')
    .select('process_id')
    .eq('core_activity_id', coreActivityId);

  if (!processLinks?.length) return { success: true, data: [] };

  const processIds = processLinks.map((pl) => pl.process_id);

  // processes → phases
  const { data: phaseLinks } = await supabase
    .from('workflow_phase_processes')
    .select('phase_id')
    .in('process_id', processIds);

  if (!phaseLinks?.length) return { success: true, data: [] };

  const phaseIds = [...new Set(phaseLinks.map((pl) => pl.phase_id))];

  // phases → workflows
  const { data: phases } = await supabase
    .from('workflow_phases')
    .select('workflow_id')
    .in('id', phaseIds);

  if (!phases?.length) return { success: true, data: [] };

  const workflowIds = [...new Set(phases.map((p) => p.workflow_id))];

  const { data: workflows } = await supabase
    .from('workflows')
    .select('id, title')
    .in('id', workflowIds);

  return { success: true, data: workflows || [] };
}
