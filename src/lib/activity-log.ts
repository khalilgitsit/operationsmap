import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';

type ObjectType = Database['public']['Enums']['object_type'];
type ActivityAction = Database['public']['Enums']['activity_action'];

interface LogActivityParams {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  recordId: string;
  recordType: ObjectType;
  action: ActivityAction;
  userId: string;
  fieldName?: string;
  oldValue?: Json;
  newValue?: Json;
  commentText?: string;
}

export async function logActivity({
  supabase,
  organizationId,
  recordId,
  recordType,
  action,
  userId,
  fieldName,
  oldValue,
  newValue,
  commentText,
}: LogActivityParams) {
  const { error } = await supabase.from('activity_log').insert({
    organization_id: organizationId,
    record_id: recordId,
    record_type: recordType,
    action,
    field_name: fieldName ?? null,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    comment_text: commentText ?? null,
    user_id: userId,
  });
  if (error) throw error;
}
