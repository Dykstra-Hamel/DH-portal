import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * Clean up all open work when a lead reaches a terminal status (won/lost).
 * Uses the admin client to bypass RLS.
 *
 * - Cancels all pending/running workflow executions
 * - Deletes all non-completed tasks (cadence and non-cadence)
 * - Sets completed_at on the cadence assignment (preserves history)
 * - Leaves lead_cadence_progress intact (preserves history)
 */
export async function closeLeadForTerminalStatus(leadId: string): Promise<void> {
  const adminSupabase = createAdminClient();

  const { error: execError } = await adminSupabase
    .from('automation_executions')
    .update({ execution_status: 'cancelled' })
    .eq('lead_id', leadId)
    .in('execution_status', ['running', 'pending']);
  if (execError) console.error('[closeLeadForTerminalStatus] cancel executions error:', execError);

  const { error: taskError, count } = await adminSupabase
    .from('tasks')
    .delete({ count: 'exact' })
    .eq('related_entity_id', leadId)
    .eq('related_entity_type', 'leads')
    .neq('status', 'completed');
  if (taskError) {
    console.error('[closeLeadForTerminalStatus] delete tasks error:', taskError);
  } else {
    console.log(`[closeLeadForTerminalStatus] deleted ${count} tasks for lead ${leadId}`);
  }

  const { error: cadenceError } = await adminSupabase
    .from('lead_cadence_assignments')
    .update({ completed_at: new Date().toISOString() })
    .eq('lead_id', leadId)
    .is('completed_at', null);
  if (cadenceError) console.error('[closeLeadForTerminalStatus] complete cadence error:', cadenceError);
}
