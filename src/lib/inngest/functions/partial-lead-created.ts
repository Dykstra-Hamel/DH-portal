import { inngest, type PartialLeadCreatedEvent } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEvent } from '../client';

export const partialLeadCreated = inngest.createFunction(
  { 
    id: 'partial-lead-created', 
    name: 'Partial Lead Created - Automation Trigger' 
  },
  { event: 'partial-lead/created' },
  async ({ event, step }: { event: PartialLeadCreatedEvent; step: any }) => {
    const { partialLeadId, companyId, stepCompleted, formData, serviceAreaData, attribution } = event.data;

    console.log(`🟡 PARTIAL LEAD CREATED: ${partialLeadId} at step ${stepCompleted} for company ${companyId}`);

    // Query matching workflows
    const matchingWorkflows = await step.run('fetch-partial-lead-workflows', async () => {
      const supabase = createAdminClient();
      
      const { data: workflows, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('company_id', companyId)
        .eq('trigger_type', 'partial_lead_created')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching partial lead workflows:', error);
        return [];
      }

      // Filter workflows based on step conditions
      return (workflows || []).filter(workflow => {
        const conditions = workflow.trigger_conditions || {};
        
        // Check if step conditions are specified
        if (conditions.steps && Array.isArray(conditions.steps)) {
          return conditions.steps.includes(stepCompleted);
        }
        
        // If no step conditions specified, trigger on all steps
        return true;
      });
    });

    console.log(`🎯 FOUND ${matchingWorkflows.length} matching partial lead workflows`);

    if (matchingWorkflows.length === 0) {
      return {
        success: true,
        message: 'No matching workflows found for partial lead',
        stepCompleted,
        matchingWorkflows: []
      };
    }

    // Execute each matching workflow
    const executionResults = await Promise.all(
      matchingWorkflows.map(async (workflow: any) => {
        return step.run(`execute-workflow-${workflow.id}`, async () => {
          try {
            console.log(`⚡ Executing partial lead workflow: ${workflow.name} (${workflow.id})`);

            // Check for existing workflow execution to prevent duplicates
            const supabase = createAdminClient();
            const { data: existingExecution } = await supabase
              .from('automation_executions')
              .select('id, execution_status')
              .eq('workflow_id', workflow.id)
              .eq('company_id', companyId)
              .eq('execution_data->partialLeadId', partialLeadId)
              .eq('execution_data->stepCompleted', stepCompleted)
              .single();

            if (existingExecution && existingExecution.execution_status !== 'failed') {
              console.log(`⚠️ Workflow ${workflow.id} already executed for partial lead ${partialLeadId} at step ${stepCompleted}`);
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
                lead_id: null, // Partial leads don't have lead_id yet
                customer_id: null, // Will be set later if converted
                execution_status: 'pending',
                execution_data: {
                  partialLeadId,
                  stepCompleted,
                  formData,
                  serviceAreaData,
                  attribution,
                  triggerType: 'partial_lead_created',
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
                leadId: undefined,
                customerId: undefined,
                triggerType: 'partial_lead_created' as any,
                triggerData: {
                  partialLeadId,
                  stepCompleted,
                  formData,
                  serviceAreaData,
                  attribution,
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

    console.log(`✅ PARTIAL LEAD AUTOMATION COMPLETE: ${successfulExecutions.length} successful, ${failedExecutions.length} failed`);

    return {
      success: true,
      message: `Partial lead automation completed: ${successfulExecutions.length}/${matchingWorkflows.length} workflows executed`,
      partialLeadId,
      stepCompleted,
      companyId,
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
        skipped: executionResults.filter(r => r.skipped).length
      }
    };
  }
);