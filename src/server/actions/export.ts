'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import type { ActionResult } from '@/types/actions';
import type { FunctionChartExportData, WorkflowExportData } from '@/lib/markdown-export';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(supabase: any, table: string): any {
  return supabase.from(table);
}

export async function getFunctionChartExportData(): Promise<ActionResult<FunctionChartExportData>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // Get all functions
  const { data: functions, error: funcError } = await fromTable(supabase, 'functions')
    .select('*')
    .order('title', { ascending: true });
  if (funcError) return { success: false, error: funcError.message };

  // Get all subfunctions
  const { data: subfunctions } = await fromTable(supabase, 'subfunctions')
    .select('*')
    .order('position', { ascending: true });

  // Get all core activities
  const { data: coreActivities } = await fromTable(supabase, 'core_activities')
    .select('*')
    .order('position', { ascending: true });

  const subMap = new Map<string, Record<string, unknown>[]>();
  for (const sub of (subfunctions || []) as Record<string, unknown>[]) {
    const fid = sub.function_id as string;
    if (!subMap.has(fid)) subMap.set(fid, []);
    subMap.get(fid)!.push(sub);
  }

  const caMap = new Map<string, Record<string, unknown>[]>();
  for (const ca of (coreActivities || []) as Record<string, unknown>[]) {
    const sid = ca.subfunction_id as string;
    if (sid) {
      if (!caMap.has(sid)) caMap.set(sid, []);
      caMap.get(sid)!.push(ca);
    }
  }

  const result: FunctionChartExportData = {
    functions: (functions as Record<string, unknown>[]).map((func) => ({
      func,
      subfunctions: (subMap.get(func.id as string) || []).map((sub) => ({
        sub,
        coreActivities: caMap.get(sub.id as string) || [],
      })),
    })),
  };

  return { success: true, data: result };
}

export async function getWorkflowExportData(workflowId: string): Promise<ActionResult<WorkflowExportData>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const supabase = await createClient();

  // Get workflow
  const { data: workflow, error: wfError } = await fromTable(supabase, 'workflows')
    .select('*')
    .eq('id', workflowId)
    .single();
  if (wfError) return { success: false, error: wfError.message };

  // Get phases
  const { data: phases } = await fromTable(supabase, 'workflow_phases')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('position', { ascending: true });

  // Get phase-process links
  const phaseIds = (phases || []).map((p: Record<string, unknown>) => p.id);
  const { data: phaseProcessLinks } = phaseIds.length
    ? await fromTable(supabase, 'workflow_phase_processes')
        .select('*')
        .in('phase_id', phaseIds)
        .order('position', { ascending: true })
    : { data: [] };

  // Get processes
  const processIds = (phaseProcessLinks || []).map((pp: Record<string, unknown>) => pp.process_id as string);
  const { data: processes } = processIds.length
    ? await fromTable(supabase, 'processes').select('*').in('id', processIds)
    : { data: [] };
  const processMap = new Map((processes as Record<string, unknown>[] || []).map((p) => [p.id as string, p]));

  // Get process-CA links
  const { data: procCaLinks } = processIds.length
    ? await fromTable(supabase, 'process_core_activities')
        .select('*')
        .in('process_id', processIds)
        .order('position', { ascending: true })
    : { data: [] };

  // Get core activities
  const caIds = (procCaLinks || []).map((pc: Record<string, unknown>) => pc.core_activity_id as string);
  const { data: coreActivities } = caIds.length
    ? await fromTable(supabase, 'core_activities').select('*').in('id', caIds)
    : { data: [] };
  const caMap = new Map((coreActivities as Record<string, unknown>[] || []).map((ca) => [ca.id as string, ca]));

  // Build CA lookup per process
  const processCaMap = new Map<string, Record<string, unknown>[]>();
  for (const link of (procCaLinks || []) as Record<string, unknown>[]) {
    const pid = link.process_id as string;
    if (!processCaMap.has(pid)) processCaMap.set(pid, []);
    const ca = caMap.get(link.core_activity_id as string);
    if (ca) processCaMap.get(pid)!.push(ca);
  }

  // Get handoff blocks
  const { data: handoffBlocks } = phaseIds.length
    ? await fromTable(supabase, 'handoff_blocks')
        .select('*')
        .in('phase_id', phaseIds)
        .order('position', { ascending: true })
    : { data: [] };
  const handoffMap = new Map<string, Record<string, unknown>[]>();
  for (const hb of (handoffBlocks || []) as Record<string, unknown>[]) {
    const pid = hb.phase_id as string;
    if (!handoffMap.has(pid)) handoffMap.set(pid, []);
    handoffMap.get(pid)!.push(hb);
  }

  // Build phase-process lookup
  const phaseProcessMap = new Map<string, Record<string, unknown>[]>();
  for (const link of (phaseProcessLinks || []) as Record<string, unknown>[]) {
    const phaseId = link.phase_id as string;
    if (!phaseProcessMap.has(phaseId)) phaseProcessMap.set(phaseId, []);
    const process = processMap.get(link.process_id as string);
    if (process) phaseProcessMap.get(phaseId)!.push(process);
  }

  const result: WorkflowExportData = {
    workflow: workflow as Record<string, unknown>,
    phases: (phases as Record<string, unknown>[]).map((phase) => ({
      phase,
      processes: (phaseProcessMap.get(phase.id as string) || []).map((process) => ({
        process,
        coreActivities: processCaMap.get(process.id as string) || [],
      })),
      handoffBlocks: handoffMap.get(phase.id as string) || [],
    })),
  };

  return { success: true, data: result };
}
