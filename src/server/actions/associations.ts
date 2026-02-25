'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';
import type { ActionResult } from '@/types/actions';
import type { Database } from '@/types/database';

type ObjectType = Database['public']['Enums']['object_type'];

// Valid junction table names
type JunctionTable =
  | 'function_roles' | 'function_people' | 'function_software' | 'function_workflows'
  | 'subfunction_roles' | 'subfunction_people' | 'subfunction_software' | 'subfunction_processes'
  | 'process_core_activities' | 'process_subfunctions' | 'process_roles_involved'
  | 'process_people_involved' | 'process_software'
  | 'core_activity_roles' | 'core_activity_people' | 'core_activity_software'
  | 'role_people' | 'role_subfunctions'
  | 'software_people' | 'software_roles';

// Column name mappings per junction table
const JUNCTION_COLUMNS: Record<JunctionTable, { sourceCol: string; targetCol: string; sourceType: ObjectType; targetType: ObjectType }> = {
  function_roles: { sourceCol: 'function_id', targetCol: 'role_id', sourceType: 'function', targetType: 'role' },
  function_people: { sourceCol: 'function_id', targetCol: 'person_id', sourceType: 'function', targetType: 'person' },
  function_software: { sourceCol: 'function_id', targetCol: 'software_id', sourceType: 'function', targetType: 'software' },
  function_workflows: { sourceCol: 'function_id', targetCol: 'workflow_id', sourceType: 'function', targetType: 'function' },
  subfunction_roles: { sourceCol: 'subfunction_id', targetCol: 'role_id', sourceType: 'subfunction', targetType: 'role' },
  subfunction_people: { sourceCol: 'subfunction_id', targetCol: 'person_id', sourceType: 'subfunction', targetType: 'person' },
  subfunction_software: { sourceCol: 'subfunction_id', targetCol: 'software_id', sourceType: 'subfunction', targetType: 'software' },
  subfunction_processes: { sourceCol: 'subfunction_id', targetCol: 'process_id', sourceType: 'subfunction', targetType: 'process' },
  process_core_activities: { sourceCol: 'process_id', targetCol: 'core_activity_id', sourceType: 'process', targetType: 'core_activity' },
  process_subfunctions: { sourceCol: 'process_id', targetCol: 'subfunction_id', sourceType: 'process', targetType: 'subfunction' },
  process_roles_involved: { sourceCol: 'process_id', targetCol: 'role_id', sourceType: 'process', targetType: 'role' },
  process_people_involved: { sourceCol: 'process_id', targetCol: 'person_id', sourceType: 'process', targetType: 'person' },
  process_software: { sourceCol: 'process_id', targetCol: 'software_id', sourceType: 'process', targetType: 'software' },
  core_activity_roles: { sourceCol: 'core_activity_id', targetCol: 'role_id', sourceType: 'core_activity', targetType: 'role' },
  core_activity_people: { sourceCol: 'core_activity_id', targetCol: 'person_id', sourceType: 'core_activity', targetType: 'person' },
  core_activity_software: { sourceCol: 'core_activity_id', targetCol: 'software_id', sourceType: 'core_activity', targetType: 'software' },
  role_people: { sourceCol: 'role_id', targetCol: 'person_id', sourceType: 'role', targetType: 'person' },
  role_subfunctions: { sourceCol: 'role_id', targetCol: 'subfunction_id', sourceType: 'role', targetType: 'subfunction' },
  software_people: { sourceCol: 'software_id', targetCol: 'person_id', sourceType: 'software', targetType: 'person' },
  software_roles: { sourceCol: 'software_id', targetCol: 'role_id', sourceType: 'software', targetType: 'role' },
};

export async function addAssociation(
  table: JunctionTable,
  sourceId: string,
  targetId: string,
  position?: number
): Promise<ActionResult<null>> {
  const config = JUNCTION_COLUMNS[table];
  if (!config) return { success: false, error: 'Invalid junction table' };

  const { userId, organizationId } = await getAuthContext();
  const supabase = await createClient();

  const insertData: Record<string, unknown> = {
    [config.sourceCol]: sourceId,
    [config.targetCol]: targetId,
    created_by: userId,
  };

  if (position !== undefined && table === 'process_core_activities') {
    insertData.position = position;
  }

  const { error } = await supabase.from(table).insert(insertData as never);
  if (error) return { success: false, error: error.message };

  await logActivity({
    supabase,
    organizationId,
    recordId: sourceId,
    recordType: config.sourceType,
    action: 'association_added',
    userId,
    fieldName: table,
    newValue: targetId,
  });

  return { success: true, data: null };
}

export async function removeAssociation(
  table: JunctionTable,
  sourceId: string,
  targetId: string
): Promise<ActionResult<null>> {
  const config = JUNCTION_COLUMNS[table];
  if (!config) return { success: false, error: 'Invalid junction table' };

  const { userId, organizationId } = await getAuthContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from(table)
    .delete()
    .eq(config.sourceCol as never, sourceId as never)
    .eq(config.targetCol as never, targetId as never);

  if (error) return { success: false, error: error.message };

  await logActivity({
    supabase,
    organizationId,
    recordId: sourceId,
    recordType: config.sourceType,
    action: 'association_removed',
    userId,
    fieldName: table,
    oldValue: targetId,
  });

  return { success: true, data: null };
}
