'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthContextSafe } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';
import { createNotification } from '@/lib/notifications';
import type { ActionResult } from '@/types/actions';
import type { Database } from '@/types/database';

type ObjectType = Database['public']['Enums']['object_type'];
type TableName = keyof Database['public']['Tables'];

const TABLE_MAP: Record<string, TableName> = {
  function: 'functions',
  subfunction: 'subfunctions',
  process: 'processes',
  core_activity: 'core_activities',
  person: 'persons',
  role: 'roles',
  software: 'software',
  sop: 'sops',
  checklist: 'checklists',
  template: 'templates',
};

const TYPE_LABELS: Record<string, string> = {
  function: 'Function',
  subfunction: 'Subfunction',
  process: 'Process',
  core_activity: 'Core Activity',
  person: 'Person',
  role: 'Role',
  software: 'Software',
  sop: 'SOP',
  checklist: 'Checklist',
  template: 'Template',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecordTitle(supabase: any, objectType: string, id: string): Promise<string> {
  const table = TABLE_MAP[objectType];
  if (!table) return 'a record';
  const fields = objectType === 'person' ? 'first_name,last_name' : 'title';
  const { data } = await supabase.from(table).select(fields).eq('id', id).single();
  if (!data) return 'a record';
  if (objectType === 'person') {
    return `${(data as Record<string, string>).first_name || ''} ${(data as Record<string, string>).last_name || ''}`.trim() || 'a person';
  }
  return (data as Record<string, string>).title || 'a record';
}

// Valid junction table names
type JunctionTable =
  | 'function_roles' | 'function_people' | 'function_software' | 'function_workflows'
  | 'subfunction_roles' | 'subfunction_people' | 'subfunction_software' | 'subfunction_processes'
  | 'process_core_activities' | 'process_subfunctions' | 'process_roles_involved'
  | 'process_people_involved' | 'process_software'
  | 'core_activity_roles' | 'core_activity_people' | 'core_activity_software'
  | 'role_people' | 'role_subfunctions'
  | 'software_people' | 'software_roles'
  // SOP junction tables
  | 'sop_core_activities' | 'sop_processes' | 'sop_subfunctions' | 'sop_functions'
  | 'sop_roles' | 'sop_people' | 'sop_software'
  // Checklist junction tables
  | 'checklist_core_activities' | 'checklist_processes' | 'checklist_subfunctions'
  | 'checklist_roles' | 'checklist_people' | 'checklist_software'
  // Template junction tables
  | 'template_core_activities' | 'template_processes' | 'template_subfunctions'
  | 'template_roles' | 'template_software' | 'template_sops' | 'template_checklists';

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
  // SOP associations
  sop_core_activities: { sourceCol: 'sop_id', targetCol: 'core_activity_id', sourceType: 'sop', targetType: 'core_activity' },
  sop_processes: { sourceCol: 'sop_id', targetCol: 'process_id', sourceType: 'sop', targetType: 'process' },
  sop_subfunctions: { sourceCol: 'sop_id', targetCol: 'subfunction_id', sourceType: 'sop', targetType: 'subfunction' },
  sop_functions: { sourceCol: 'sop_id', targetCol: 'function_id', sourceType: 'sop', targetType: 'function' },
  sop_roles: { sourceCol: 'sop_id', targetCol: 'role_id', sourceType: 'sop', targetType: 'role' },
  sop_people: { sourceCol: 'sop_id', targetCol: 'person_id', sourceType: 'sop', targetType: 'person' },
  sop_software: { sourceCol: 'sop_id', targetCol: 'software_id', sourceType: 'sop', targetType: 'software' },
  // Checklist associations
  checklist_core_activities: { sourceCol: 'checklist_id', targetCol: 'core_activity_id', sourceType: 'checklist', targetType: 'core_activity' },
  checklist_processes: { sourceCol: 'checklist_id', targetCol: 'process_id', sourceType: 'checklist', targetType: 'process' },
  checklist_subfunctions: { sourceCol: 'checklist_id', targetCol: 'subfunction_id', sourceType: 'checklist', targetType: 'subfunction' },
  checklist_roles: { sourceCol: 'checklist_id', targetCol: 'role_id', sourceType: 'checklist', targetType: 'role' },
  checklist_people: { sourceCol: 'checklist_id', targetCol: 'person_id', sourceType: 'checklist', targetType: 'person' },
  checklist_software: { sourceCol: 'checklist_id', targetCol: 'software_id', sourceType: 'checklist', targetType: 'software' },
  // Template associations
  template_core_activities: { sourceCol: 'template_id', targetCol: 'core_activity_id', sourceType: 'template', targetType: 'core_activity' },
  template_processes: { sourceCol: 'template_id', targetCol: 'process_id', sourceType: 'template', targetType: 'process' },
  template_subfunctions: { sourceCol: 'template_id', targetCol: 'subfunction_id', sourceType: 'template', targetType: 'subfunction' },
  template_roles: { sourceCol: 'template_id', targetCol: 'role_id', sourceType: 'template', targetType: 'role' },
  template_software: { sourceCol: 'template_id', targetCol: 'software_id', sourceType: 'template', targetType: 'software' },
  template_sops: { sourceCol: 'template_id', targetCol: 'sop_id', sourceType: 'template', targetType: 'sop' },
  template_checklists: { sourceCol: 'template_id', targetCol: 'checklist_id', sourceType: 'template', targetType: 'checklist' },
};

export async function addAssociation(
  table: JunctionTable,
  sourceId: string,
  targetId: string,
  position?: number
): Promise<ActionResult<null>> {
  const config = JUNCTION_COLUMNS[table];
  if (!config) return { success: false, error: 'Invalid junction table' };

  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
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

  // Notify record owner about the association change
  const targetTitle = await getRecordTitle(supabase, config.targetType, targetId);
  const targetLabel = TYPE_LABELS[config.targetType] || config.targetType;
  await createNotification({
    organizationId,
    recordId: sourceId,
    recordType: config.sourceType,
    message: `${targetLabel} "${targetTitle}" was added`,
    excludeUserId: userId,
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

  const auth = await getAuthContextSafe();
  if (!auth) return { success: false, error: 'Not authenticated' };
  const { userId, organizationId } = auth;
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

  // Notify record owner about the association removal
  const targetTitle = await getRecordTitle(supabase, config.targetType, targetId);
  const targetLabel = TYPE_LABELS[config.targetType] || config.targetType;
  await createNotification({
    organizationId,
    recordId: sourceId,
    recordType: config.sourceType,
    message: `${targetLabel} "${targetTitle}" was removed`,
    excludeUserId: userId,
  });

  return { success: true, data: null };
}
