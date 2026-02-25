import { createServiceClient } from '@/lib/supabase/server';

interface CreateNotificationParams {
  organizationId: string;
  recordId: string;
  recordType: string;
  message: string;
  excludeUserId?: string; // Don't notify the user who performed the action
}

/**
 * Creates notifications for users who "own" a record.
 * Ownership is determined by created_by on the record.
 * Notifications are created for the record creator, excluding the actor.
 */
export async function createNotification({
  organizationId,
  recordId,
  recordType,
  message,
  excludeUserId,
}: CreateNotificationParams) {
  const serviceClient = await createServiceClient();

  const TABLE_MAP: Record<string, string> = {
    function: 'functions',
    subfunction: 'subfunctions',
    process: 'processes',
    core_activity: 'core_activities',
    person: 'persons',
    role: 'roles',
    software: 'software',
  };

  const table = TABLE_MAP[recordType];
  if (!table) return;

  // Get record creator
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: record } = await (serviceClient as any).from(table).select('created_by').eq('id', recordId).single();
  if (!record) return;

  const createdBy = (record as { created_by: string }).created_by;
  if (createdBy === excludeUserId) return; // Don't notify yourself

  await serviceClient.from('notifications').insert({
    user_id: createdBy,
    organization_id: organizationId,
    record_id: recordId,
    record_type: recordType,
    message,
  } as never);
}
