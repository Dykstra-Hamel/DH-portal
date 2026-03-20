import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * Cancel all active cadence work for a lead during a status transition.
 * Uses the admin client to bypass RLS.
 *
 * - Cancels all pending/running workflow executions
 * - Deletes all non-completed cadence tasks
 * - Removes cadence assignments and progress records
 */
export async function stopActiveCadence(leadId: string): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  await admin
    .from('automation_executions')
    .update({ execution_status: 'cancelled', completed_at: now })
    .eq('lead_id', leadId)
    .in('execution_status', ['running', 'pending']);

  await admin
    .from('tasks')
    .delete()
    .eq('related_entity_id', leadId)
    .eq('related_entity_type', 'leads')
    .not('cadence_step_id', 'is', null)
    .neq('status', 'completed');

  await admin
    .from('lead_cadence_assignments')
    .delete()
    .eq('lead_id', leadId);

  await admin
    .from('lead_cadence_progress')
    .delete()
    .eq('lead_id', leadId);
}
