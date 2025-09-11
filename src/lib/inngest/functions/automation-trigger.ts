import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import type { AutomationTriggerEvent } from '../client';

export const automationTriggerHandler = inngest.createFunction(
  {
    id: 'automation-trigger-handler',
    name: 'Handle Automation Trigger',
    retries: 3,
  },
  { event: 'automation/trigger' },
  async ({ event, step }) => {
    const { workflowId, companyId, triggerData } = event.data;
    const { executionId } = triggerData;
    
    console.log(`Processing automation trigger for workflow: ${workflowId}`);

    // Step 1: Get workflow configuration
    const workflowConfig = await step.run('get-workflow-config', async () => {
      const supabase = createAdminClient();
      
      const { data: workflow } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('is_active', true)
        .single();

      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found or inactive`);
      }

      return workflow;
    });

    // Step 2: Update execution status to running
    await step.run('update-execution-status', async () => {
      const supabase = createAdminClient();
      
      await supabase
        .from('automation_executions')
        .update({ 
          execution_status: 'running',
          current_step: 'processing_steps',
          updated_at: new Date().toISOString(),
        })
        .eq('id', executionId);
    });

    // Step 3: Create execution record and delegate to proper workflow engine
    const executionResult = await step.run('create-execution-and-delegate', async () => {
      const supabase = createAdminClient();
      const { formData, partialLeadId, attribution, serviceAreaData, stepCompleted } = triggerData;

      // Create execution record (same pattern as widget-schedule-completed.ts)
      const { data: execution, error: executionError } = await supabase
        .from('automation_executions')
        .insert([{
          workflow_id: workflowId,
          company_id: companyId,
          lead_id: triggerData.leadId,
          customer_id: triggerData.customerId,
          execution_status: 'running',
          started_at: new Date().toISOString(),
          current_step: 'step-0',
          execution_data: {
            partialLeadId,
            formData,
            serviceAreaData,
            stepCompleted,
            attribution: attribution || {},
            triggerType: 'partial_lead_automation',
            stepIndex: 0
          }
        }])
        .select()
        .single();

      if (executionError) {
        console.error(`Database error creating workflow execution:`, executionError);
        throw new Error(`Failed to create workflow execution record: ${executionError.message}`);
      }

      if (!execution) {
        console.error(`No execution record returned from insert operation`);
        throw new Error('Failed to create workflow execution record - no data returned');
      }

      console.log(`📋 EXECUTION CREATED: ${execution.id}`);

      // Send workflow execution event to proper workflow engine (same as widget submissions)
      await inngest.send({
        name: 'workflow/execute',
        data: {
          executionId: execution.id,
          workflowId: workflowId,
          companyId,
          leadId: triggerData.leadId,
          customerId: triggerData.customerId,
          stepIndex: 0,
          leadData: {
            partialLeadId,
            stepCompleted,
            ...formData, // Include form data for partial leads
            serviceAreaData,
          },
          attribution: attribution || {},
          triggerType: 'partial_lead_automation'
        }
      });

      return { 
        success: true, 
        message: 'Workflow execution delegated to proper engine', 
        workflowId: workflowId,
        executionId: execution.id 
      };
    });

    console.log(`Partial lead automation delegated to workflow engine: ${workflowId}`);

    return {
      success: executionResult.success,
      message: executionResult.message,
      workflowId,
      executionId: executionResult.executionId,
      delegated: true
    };
  }
);

// REMOVED: Individual step processing functions - now delegated to workflow-execute.ts

// REMOVED: All step processor functions now handled by workflow-execute.ts

