import { inngest, type InboundCallTransferEvent } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEvent } from '../client';

export const inboundCallTransfer = inngest.createFunction(
  { 
    id: 'inbound-call-transfer', 
    name: 'Inbound Call Transfer - Automation Trigger' 
  },
  { event: 'inbound-call/transfer' },
  async ({ event, step }: { event: InboundCallTransferEvent; step: any }) => {
    const { callId, companyId, leadId, customerId, callRecord, leadData, customerData, transferContext } = event.data;

    console.log(`🔄 INBOUND CALL TRANSFER: ${callId} for company ${companyId} (Lead: ${leadId})`);

    // Query matching workflows
    const matchingWorkflows = await step.run('fetch-call-transfer-workflows', async () => {
      const supabase = createAdminClient();
      
      const { data: workflows, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('company_id', companyId)
        .eq('trigger_type', 'inbound_call_transfer')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching inbound call transfer workflows:', error);
        return [];
      }

      // Filter workflows based on trigger conditions
      return (workflows || []).filter(workflow => {
        const conditions = workflow.trigger_conditions || {};
        
        // Check minimum duration condition
        if (conditions.min_duration_seconds && transferContext.callDuration < conditions.min_duration_seconds) {
          return false;
        }
        
        // Check follow-up inclusion condition
        if (!conditions.include_follow_ups && transferContext.isFollowUp) {
          return false;
        }
        
        return true;
      });
    });

    console.log(`🎯 FOUND ${matchingWorkflows.length} matching call transfer workflows`);

    if (matchingWorkflows.length === 0) {
      return {
        success: true,
        message: 'No matching workflows found for call transfer',
        callId,
        transferReason: transferContext.transferReason,
        matchingWorkflows: []
      };
    }

    // Execute each matching workflow
    const executionResults = await Promise.all(
      matchingWorkflows.map(async (workflow: any) => {
        return step.run(`execute-workflow-${workflow.id}`, async () => {
          try {
            console.log(`⚡ Executing call transfer workflow: ${workflow.name} (${workflow.id})`);

            // Check for existing workflow execution to prevent duplicates
            const supabase = createAdminClient();
            const { data: existingExecution } = await supabase
              .from('automation_executions')
              .select('id, execution_status')
              .eq('workflow_id', workflow.id)
              .eq('company_id', companyId)
              .eq('lead_id', leadId)
              .eq('execution_data->callId', callId)
              .eq('execution_data->transferReason', transferContext.transferReason)
              .single();

            if (existingExecution && existingExecution.execution_status !== 'failed') {
              console.log(`⚠️ Workflow ${workflow.id} already executed for call transfer ${callId}`);
              return {
                success: true,
                message: 'Workflow already executed',
                skipped: true,
                executionId: existingExecution.id
              };
            }

            // Create execution record
            const { data: execution, error: executionError } = await supabase
              .from('automation_executions')
              .insert([{
                workflow_id: workflow.id,
                company_id: companyId,
                lead_id: leadId,
                customer_id: customerId,
                execution_status: 'pending',
                execution_data: {
                  callId,
                  callRecord,
                  leadData,
                  customerData,
                  transferContext,
                  triggerType: 'inbound_call_transfer',
                  stepIndex: 0
                }
              }])
              .select()
              .single();

            if (executionError) {
              console.error(`Error creating execution for workflow ${workflow.id}:`, executionError);
              return {
                success: false,
                error: executionError.message,
                workflowId: workflow.id
              };
            }

            // Trigger automation execution
            await sendEvent({
              name: 'automation/trigger',
              data: {
                workflowId: workflow.id,
                companyId,
                leadId,
                customerId,
                triggerType: 'inbound_call_transfer' as any,
                triggerData: {
                  callId,
                  callRecord,
                  leadData,
                  customerData,
                  transferContext,
                  executionId: execution.id
                }
              }
            });

            return {
              success: true,
              message: `Workflow ${workflow.name} triggered successfully`,
              workflowId: workflow.id,
              executionId: execution.id
            };

          } catch (error) {
            console.error(`Error executing workflow ${workflow.id}:`, error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              workflowId: workflow.id
            };
          }
        });
      })
    );

    const successfulExecutions = executionResults.filter(result => result.success);
    const failedExecutions = executionResults.filter(result => !result.success);

    console.log(`✅ CALL TRANSFER AUTOMATION COMPLETE: ${successfulExecutions.length} successful, ${failedExecutions.length} failed`);

    return {
      success: true,
      message: `Call transfer automation completed: ${successfulExecutions.length}/${matchingWorkflows.length} workflows executed`,
      callId,
      transferReason: transferContext.transferReason,
      companyId,
      leadId,
      matchingWorkflows: matchingWorkflows.map((w: any) => ({
        id: w.id,
        name: w.name,
        conditions: w.trigger_conditions
      })),
      executionResults,
      summary: {
        totalWorkflows: matchingWorkflows.length,
        successful: successfulExecutions.length,
        failed: failedExecutions.length,
        skipped: executionResults.filter(r => r.skipped).length,
        callDuration: transferContext.callDuration,
        isFollowUp: transferContext.isFollowUp
      }
    };
  }
);