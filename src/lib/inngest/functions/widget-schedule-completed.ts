import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import type { LeadCreatedEvent } from '../client';

export const widgetScheduleCompletedHandler = inngest.createFunction(
  {
    id: 'widget-schedule-completed-handler',
    name: 'Handle Widget Schedule Form Completed',
    retries: 3,
  },
  { event: 'widget/schedule-completed' },
  async ({ event, step }) => {
    const { leadId, companyId, customerId, leadData, attribution, createdAt } = event.data;
    
    console.log(`🎯 WIDGET TRIGGER: Lead ${leadId}`);

    // Step 1: Check if automation is enabled for this company
    const automationEnabled = await step.run('check-automation-enabled', async () => {
      const supabase = createAdminClient();
      
      const { data: setting } = await supabase
        .from('company_settings')
        .select('setting_value')
        .eq('company_id', companyId)
        .eq('setting_key', 'automation_enabled')
        .single();

      return setting?.setting_value === 'true';
    });

    if (!automationEnabled) {
      console.log(`❌ AUTOMATION DISABLED`);
      return { success: true, message: 'Automation disabled' };
    }

    // Step 2: Find active workflows triggered by widget schedule completion
    const activeWorkflows = await step.run('find-active-workflows', async () => {
      const supabase = createAdminClient();
      
      const { data: workflows } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('company_id', companyId)
        .eq('trigger_type', 'widget_schedule_completed')
        .eq('is_active', true);

      return workflows || [];
    });

    if (activeWorkflows.length === 0) {
      console.log(`❌ NO ACTIVE WORKFLOWS`);
      return { success: true, message: 'No active workflows' };
    }

    // Step 3: Process each workflow
    const workflowResults = [];
    
    for (const workflow of activeWorkflows) {
      try {
        const workflowResult = await step.run(`execute-workflow-${workflow.id}`, async () => {
          console.log(`🔧 STARTING: ${workflow.name}`);
          
          const supabase = createAdminClient();
          
          const leadQuery = await supabase
            .from('leads')
            .select(`
              *,
              customers (
                first_name,
                last_name,
                email,
                phone,
                address,
                city,
                state,
                zip_code
              )
            `)
            .eq('id', leadId)
            .single();
            
          let { data: lead } = leadQuery;
          const { error: leadError } = leadQuery;

          if (leadError) {
            console.error(`Database error when fetching lead ${leadId}:`, leadError);
            throw new Error(`Database error fetching lead ${leadId}: ${leadError.message}`);
          }

          if (!lead) {
            console.error(`Lead ${leadId} not found in database. Checking if lead exists at all...`);
            
            // Try to find the lead without joins to see if it exists
            const { data: basicLead, error: basicError } = await supabase
              .from('leads')
              .select('id, customer_id, company_id, created_at')
              .eq('id', leadId)
              .single();
              
            if (basicError || !basicLead) {
              console.error(`Lead ${leadId} does not exist in leads table:`, basicError);
              throw new Error(`Lead ${leadId} not found in database`);
            } else {
              console.error(`Lead ${leadId} exists but customer join failed. Continuing without customer data.`);
              // Continue with basic lead data if customer join failed
              lead = { ...basicLead, customers: null };
            }
          }

          // Lead loaded successfully

          // Apply trigger conditions if they exist
          if (workflow.trigger_conditions && workflow.trigger_conditions.length > 0) {
            // For now, we'll proceed with all widget submissions
            // TODO: Implement detailed condition evaluation using conditionalEngine
            console.log(`Workflow ${workflow.id} has trigger conditions - proceeding for widget submission`);
          }

          // Check for existing workflow execution to prevent duplicates
          const { data: existingExecution } = await supabase
            .from('automation_executions')
            .select('id, execution_status, execution_data')
            .eq('workflow_id', workflow.id)
            .eq('lead_id', leadId)
            .eq('execution_status', 'running')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (existingExecution) {
            console.log(`⚠️  WORKFLOW ALREADY RUNNING: ${existingExecution.id}`);
            return { 
              success: true, 
              message: 'Workflow execution already running', 
              workflowId: workflow.id,
              executionId: existingExecution.id,
              skipped: true
            };
          }

          console.log(`🗂️  CREATING EXECUTION RECORD`);
          
          const { data: execution, error: executionError } = await supabase
            .from('automation_executions')
            .insert([{
              workflow_id: workflow.id,
              company_id: companyId,
              lead_id: leadId,
              customer_id: customerId,
              execution_status: 'running',
              started_at: new Date().toISOString(),
              current_step: 'step-0',
              execution_data: {
                leadData,
                attribution,
                triggerType: 'widget_schedule_completed',
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

          // Send workflow execution event to Inngest
          await inngest.send({
            name: 'workflow/execute',
            data: {
              executionId: execution.id,
              workflowId: workflow.id,
              companyId,
              leadId,
              customerId,
              stepIndex: 0,
              leadData,
              attribution,
              triggerType: 'widget_schedule_completed'
            }
          });

          return { 
            success: true, 
            message: 'Workflow execution started', 
            workflowId: workflow.id,
            executionId: execution.id 
          };
        });

        workflowResults.push(workflowResult);
        
      } catch (error) {
        console.error(`Error executing workflow ${workflow.id}:`, error);
        workflowResults.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          workflowId: workflow.id 
        });
      }
    }

    const successfulWorkflows = workflowResults.filter(r => r.success).length;
    const failedWorkflows = workflowResults.filter(r => !r.success).length;

    console.log(`Widget schedule completed processing complete for lead ${leadId}: ${successfulWorkflows} successful, ${failedWorkflows} failed`);

    return {
      success: true,
      message: `Processed ${activeWorkflows.length} workflows`,
      results: workflowResults,
      summary: {
        successful: successfulWorkflows,
        failed: failedWorkflows
      }
    };
  }
);