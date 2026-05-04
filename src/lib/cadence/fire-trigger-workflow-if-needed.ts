import { createAdminClient } from '@/lib/supabase/server-admin';
import { triggerWorkflowForCadenceStep } from './trigger-workflow-step';

/**
 * After a DB trigger inserts a new lead_cadence_assignment, check whether the
 * first step of that cadence is a `trigger_workflow` action type and, if so,
 * fire the workflow.
 *
 * The DB trigger `trigger_create_first_task_on_cadence_assignment` skips task
 * creation for `trigger_workflow` steps — this function fills that gap from
 * app code (DB triggers cannot call Inngest / external services directly).
 *
 * Non-throwing: errors are logged but do not propagate so that the surrounding
 * lead update is never failed due to a cadence workflow issue.
 */
export async function fireTriggerWorkflowIfNeeded(
  leadId: string,
  companyId: string
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Get the current cadence assignment for this lead
    const { data: assignment } = await admin
      .from('lead_cadence_assignments')
      .select('cadence_id')
      .eq('lead_id', leadId)
      .is('completed_at', null)
      .maybeSingle();

    if (!assignment?.cadence_id) return;

    // Get the first step of that cadence
    const { data: firstStep } = await admin
      .from('sales_cadence_steps')
      .select('id, action_type, workflow_id')
      .eq('cadence_id', assignment.cadence_id)
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstStep?.action_type !== 'trigger_workflow' || !firstStep.workflow_id) return;

    // Resolve customer_id for the lead
    const { data: lead } = await admin
      .from('leads')
      .select('customer_id')
      .eq('id', leadId)
      .single();

    await triggerWorkflowForCadenceStep({
      leadId,
      companyId,
      customerId: lead?.customer_id ?? null,
      cadenceStepId: firstStep.id,
      workflowId: firstStep.workflow_id,
      cadenceId: assignment.cadence_id,
    });
  } catch (err) {
    console.error('[fireTriggerWorkflowIfNeeded] Error:', err);
  }
}
