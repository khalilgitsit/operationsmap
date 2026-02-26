'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';
import type { ActionResult } from '@/types/actions';
import type {
  ParsedFunctionChart,
  ParsedWorkflow,
} from '@/lib/markdown-import';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(supabase: any, table: string): any {
  return supabase.from(table);
}

/**
 * Import a parsed Function Chart structure into the database.
 * All items are created with Draft status.
 */
export async function importFunctionChart(
  parsed: ParsedFunctionChart
): Promise<ActionResult<{ functionsCreated: number; subfunctionsCreated: number; coreActivitiesCreated: number }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  let functionsCreated = 0;
  let subfunctionsCreated = 0;
  let coreActivitiesCreated = 0;

  for (const fn of parsed.functions) {
    // Create function
    const { data: funcData, error: funcError } = await fromTable(supabase, 'functions')
      .insert({
        title: fn.title,
        status: 'Draft',
        description: fn.description || null,
        organization_id: organizationId,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (funcError) return { success: false, error: `Failed to create function "${fn.title}": ${funcError.message}` };
    functionsCreated++;

    await logActivity({
      supabase,
      organizationId,
      recordId: funcData.id,
      recordType: 'function',
      action: 'created',
      userId,
    });

    // Create subfunctions
    for (let sfIdx = 0; sfIdx < fn.subfunctions.length; sfIdx++) {
      const sf = fn.subfunctions[sfIdx];

      const { data: sfData, error: sfError } = await fromTable(supabase, 'subfunctions')
        .insert({
          title: sf.title,
          status: 'Draft',
          description: sf.description || null,
          function_id: funcData.id,
          position: sfIdx,
          organization_id: organizationId,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (sfError) return { success: false, error: `Failed to create subfunction "${sf.title}": ${sfError.message}` };
      subfunctionsCreated++;

      await logActivity({
        supabase,
        organizationId,
        recordId: sfData.id,
        recordType: 'subfunction',
        action: 'created',
        userId,
      });

      // Create core activities
      for (let caIdx = 0; caIdx < sf.coreActivities.length; caIdx++) {
        const ca = sf.coreActivities[caIdx];

        const { data: caData, error: caError } = await fromTable(supabase, 'core_activities')
          .insert({
            title: ca.title,
            status: 'Draft',
            trigger: ca.trigger || null,
            end_state: ca.end_state || null,
            subfunction_id: sfData.id,
            position: caIdx,
            organization_id: organizationId,
            created_by: userId,
            updated_by: userId,
          })
          .select()
          .single();

        if (caError) return { success: false, error: `Failed to create core activity "${ca.title}": ${caError.message}` };
        coreActivitiesCreated++;

        await logActivity({
          supabase,
          organizationId,
          recordId: caData.id,
          recordType: 'core_activity',
          action: 'created',
          userId,
        });
      }
    }
  }

  return {
    success: true,
    data: { functionsCreated, subfunctionsCreated, coreActivitiesCreated },
  };
}

/**
 * Import a parsed Workflow structure into the database.
 * Creates a new workflow with phases, processes, core activities, and handoff blocks.
 * All items are created with Draft status.
 */
export async function importWorkflow(
  parsed: ParsedWorkflow
): Promise<ActionResult<{ phasesCreated: number; processesCreated: number; coreActivitiesCreated: number; handoffsCreated: number }>> {
  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
  const supabase = await createClient();

  // Create the workflow
  const { data: wfData, error: wfError } = await fromTable(supabase, 'workflows')
    .insert({
      title: parsed.title,
      description: parsed.description || null,
      organization_id: organizationId,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (wfError) return { success: false, error: `Failed to create workflow: ${wfError.message}` };

  let phasesCreated = 0;
  let processesCreated = 0;
  let coreActivitiesCreated = 0;
  let handoffsCreated = 0;

  for (let phaseIdx = 0; phaseIdx < parsed.phases.length; phaseIdx++) {
    const phase = parsed.phases[phaseIdx];

    // Create phase
    const { data: phaseData, error: phaseError } = await fromTable(supabase, 'workflow_phases')
      .insert({
        workflow_id: wfData.id,
        title: phase.title,
        description: phase.description || null,
        status: 'Draft',
        position: phaseIdx,
        organization_id: organizationId,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (phaseError) return { success: false, error: `Failed to create phase "${phase.title}": ${phaseError.message}` };
    phasesCreated++;

    // Create processes and link to phase
    for (let procIdx = 0; procIdx < phase.processes.length; procIdx++) {
      const proc = phase.processes[procIdx];

      // Create the process record
      const { data: procData, error: procError } = await fromTable(supabase, 'processes')
        .insert({
          title: proc.title,
          status: 'Draft',
          trigger: proc.trigger || null,
          end_state: proc.end_state || null,
          description: proc.description || null,
          organization_id: organizationId,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (procError) return { success: false, error: `Failed to create process "${proc.title}": ${procError.message}` };
      processesCreated++;

      await logActivity({
        supabase,
        organizationId,
        recordId: procData.id,
        recordType: 'process',
        action: 'created',
        userId,
      });

      // Link process to phase
      const { error: linkError } = await fromTable(supabase, 'workflow_phase_processes')
        .insert({
          phase_id: phaseData.id,
          process_id: procData.id,
          position: procIdx,
          created_by: userId,
        });

      if (linkError) return { success: false, error: `Failed to link process to phase: ${linkError.message}` };

      // Create core activities and link to process
      for (let caIdx = 0; caIdx < proc.coreActivities.length; caIdx++) {
        const ca = proc.coreActivities[caIdx];

        const { data: caData, error: caError } = await fromTable(supabase, 'core_activities')
          .insert({
            title: ca.title,
            status: 'Draft',
            trigger: ca.trigger || null,
            end_state: ca.end_state || null,
            organization_id: organizationId,
            created_by: userId,
            updated_by: userId,
          })
          .select()
          .single();

        if (caError) return { success: false, error: `Failed to create core activity "${ca.title}": ${caError.message}` };
        coreActivitiesCreated++;

        await logActivity({
          supabase,
          organizationId,
          recordId: caData.id,
          recordType: 'core_activity',
          action: 'created',
          userId,
        });

        // Link CA to process
        const { error: caLinkError } = await fromTable(supabase, 'process_core_activities')
          .insert({
            process_id: procData.id,
            core_activity_id: caData.id,
            position: caIdx,
            created_by: userId,
          });

        if (caLinkError) return { success: false, error: `Failed to link core activity to process: ${caLinkError.message}` };
      }
    }

    // Create handoff blocks
    for (let hIdx = 0; hIdx < phase.handoffs.length; hIdx++) {
      const handoff = phase.handoffs[hIdx];

      const { error: hError } = await fromTable(supabase, 'handoff_blocks')
        .insert({
          workflow_id: wfData.id,
          from_phase_id: phaseData.id,
          label: handoff.label,
          position: hIdx,
          organization_id: organizationId,
          created_by: userId,
        });

      if (hError) return { success: false, error: `Failed to create handoff block: ${hError.message}` };
      handoffsCreated++;
    }
  }

  return {
    success: true,
    data: { phasesCreated, processesCreated, coreActivitiesCreated, handoffsCreated },
  };
}
