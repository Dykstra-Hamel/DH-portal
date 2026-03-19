import { createAdminClient } from '@/lib/supabase/server-admin';
import { inngest } from '@/lib/inngest/client';

export interface TriggerWorkflowStepParams {
  leadId: string;
  companyId: string;
  customerId: string | null;
  cadenceStepId: string;
  workflowId: string;
  cadenceId: string;
}

/**
 * Fire an automation workflow for a trigger_workflow cadence step.
 *
 * 1. Verifies the workflow is active.
 * 2. Deduplication guard — skips if a pending/running execution already exists
 *    for this workflow + lead + cadence step.
 * 3. Inserts an automation_executions record.
 * 4. Sends the `workflow/execute` Inngest event.
 *
 * Returns true if the workflow was fired, false if it was skipped or an error
 * occurred (non-throwing — cadence assignment must not fail due to workflow errors).
 */
export async function triggerWorkflowForCadenceStep(
  params: TriggerWorkflowStepParams
): Promise<boolean> {
  const { leadId, companyId, customerId, cadenceStepId, workflowId, cadenceId } = params;

  try {
    const adminSupabase = createAdminClient();

    // 1. Verify workflow is active
    const { data: workflow } = await adminSupabase
      .from('automation_workflows')
      .select('id, is_active')
      .eq('id', workflowId)
      .single();

    if (!workflow?.is_active) {
      return false;
    }

    // 2. Deduplication guard
    const { data: existingExecution } = await adminSupabase
      .from('automation_executions')
      .select('id')
      .eq('workflow_id', workflowId)
      .eq('lead_id', leadId)
      .eq('cadence_step_id', cadenceStepId)
      .in('execution_status', ['pending', 'running'])
      .maybeSingle();

    if (existingExecution) {
      return false;
    }

    // 3. Insert execution record
    const { data: execution } = await adminSupabase
      .from('automation_executions')
      .insert({
        workflow_id: workflowId,
        lead_id: leadId,
        company_id: companyId,
        execution_status: 'pending',
        cadence_step_id: cadenceStepId,
        cadence_lead_id: leadId,
        execution_data: {
          triggeredByCadenceStep: cadenceStepId,
          cadenceId,
        },
      })
      .select()
      .single();

    if (!execution) {
      return false;
    }

    // 4. Fire Inngest
    await inngest.send({
      name: 'workflow/execute',
      data: {
        executionId: execution.id,
        workflowId,
        companyId,
        leadId,
        customerId,
        leadData: {},
        triggerType: 'cadence_step',
      },
    });

    return true;
  } catch (err) {
    console.error('[triggerWorkflowForCadenceStep] Error firing workflow for cadence step:', err);
    return false;
  }
}
