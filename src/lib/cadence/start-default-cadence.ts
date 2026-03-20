import { createAdminClient } from '@/lib/supabase/server-admin';
import { triggerWorkflowForCadenceStep } from './trigger-workflow-step';

/**
 * Start a stage-appropriate default cadence for a lead via company_settings.
 * Reads the cadence ID from the given setting key, verifies the cadence is
 * active, then inserts a lead_cadence_assignment row. The DB trigger
 * `trigger_create_first_task_on_cadence_assignment` handles first-task creation
 * for non-trigger_workflow steps. If the first step is trigger_workflow, this
 * function fires the workflow directly.
 */
export async function startDefaultCadenceForStage(
  leadId: string,
  companyId: string,
  settingKey: string,
  assignedTo: string
) {
  console.log('[startDefaultCadenceForStage] called', { leadId, companyId, settingKey, assignedTo });
  const adminSupabase = createAdminClient();

  const { data: setting, error: settingError } = await adminSupabase
    .from('company_settings')
    .select('setting_value')
    .eq('company_id', companyId)
    .eq('setting_key', settingKey)
    .maybeSingle();

  console.log('[startDefaultCadenceForStage] company_settings result', { setting, settingError });

  if (!setting?.setting_value) {
    console.log('[startDefaultCadenceForStage] no setting value found, exiting');
    return;
  }

  const cadenceId = setting.setting_value;

  const { data: cadence, error: cadenceError } = await adminSupabase
    .from('sales_cadences')
    .select('id')
    .eq('id', cadenceId)
    .eq('is_active', true)
    .maybeSingle();

  console.log('[startDefaultCadenceForStage] sales_cadences result', { cadence, cadenceError });

  if (!cadence) {
    console.log('[startDefaultCadenceForStage] cadence not found or inactive, exiting');
    return;
  }

  // Remove any stale assignment so the INSERT always succeeds (UNIQUE lead_id constraint)
  const { error: deleteError } = await adminSupabase
    .from('lead_cadence_assignments')
    .delete()
    .eq('lead_id', leadId);
  console.log('[startDefaultCadenceForStage] pre-insert delete', { deleteError });

  const { error: insertError } = await adminSupabase.from('lead_cadence_assignments').insert({
    lead_id: leadId,
    cadence_id: cadenceId,
    started_at: new Date().toISOString(),
  });

  console.log('[startDefaultCadenceForStage] insert result', { insertError });

  if (insertError) {
    console.error('[startDefaultCadenceForStage] Insert failed:', insertError);
    return;
  }

  // If the first step is trigger_workflow, fire the workflow directly —
  // the DB trigger skips task creation for trigger_workflow steps.
  try {
    const { data: firstStep } = await adminSupabase
      .from('sales_cadence_steps')
      .select('id, action_type, workflow_id')
      .eq('cadence_id', cadenceId)
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (firstStep?.action_type === 'trigger_workflow' && firstStep.workflow_id) {
      const { data: lead } = await adminSupabase
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
        cadenceId,
      });
    }
  } catch (err) {
    console.error('[startDefaultCadenceForStage] Error firing trigger_workflow first step:', err);
  }
}
