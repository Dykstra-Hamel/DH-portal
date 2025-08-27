import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import type { LeadCreatedEvent } from '../client';

export const leadCreatedHandler = inngest.createFunction(
  {
    id: 'lead-created-handler',
    name: 'Handle Lead Created',
    retries: 3,
  },
  { event: 'lead/created' },
  async ({ event, step }) => {
    const { leadId, companyId, customerId, leadData, attribution, createdAt } = event.data;
    
    console.log(`Processing lead created: ${leadId} for company: ${companyId}`);

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
      console.log(`Automation disabled for company ${companyId}, skipping`);
      return { success: true, message: 'Automation disabled' };
    }

    // Step 2: Check if this is a widget submission (should be handled by widget handler)
    const isWidgetSubmission = await step.run('check-widget-submission', async () => {
      if (leadData?.leadSource === 'widget_submission' || attribution?.leadSource === 'widget_submission') {
        return true;
      }
      
      // Also check the database for lead_source
      const supabase = createAdminClient();
      const { data: lead } = await supabase
        .from('leads')
        .select('lead_source')
        .eq('id', leadId)
        .single();
        
      return lead?.lead_source === 'widget_submission';
    });

    if (isWidgetSubmission) {
      console.log(`Skipping lead_created handler for widget submission: ${leadId}`);
      return { success: true, message: 'Widget submission - handled by widget handler' };
    }

    // Step 3: Find active workflows triggered by lead creation
    const activeWorkflows = await step.run('find-active-workflows', async () => {
      const supabase = createAdminClient();
      
      const { data: workflows } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('company_id', companyId)
        .eq('trigger_type', 'lead_created')
        .eq('is_active', true);

      return workflows || [];
    });

    if (activeWorkflows.length === 0) {
      console.log(`No active lead creation workflows for company ${companyId}`);
      return { success: true, message: 'No active workflows' };
    }

    // Step 4: Process each workflow
    const workflowResults = await Promise.all(
      activeWorkflows.map(async (workflow) => {
        return step.run(`process-workflow-${workflow.id}`, async () => {
          // Check if workflow conditions are met
          const conditionsMet = await evaluateWorkflowConditions(workflow, leadData, attribution);
          
          if (!conditionsMet) {
            return { workflowId: workflow.id, skipped: true, reason: 'Conditions not met' };
          }

          // Create execution record
          const supabase = createAdminClient();
          const { data: execution } = await supabase
            .from('automation_executions')
            .insert([{
              workflow_id: workflow.id,
              company_id: companyId,
              lead_id: leadId,
              customer_id: customerId,
              execution_status: 'pending',
              execution_data: {
                leadData,
                attribution,
                createdAt,
              },
            }])
            .select()
            .single();

          if (!execution) {
            throw new Error(`Failed to create execution record for workflow ${workflow.id}`);
          }

          // Trigger the workflow automation
          await inngest.send({
            name: 'automation/trigger',
            data: {
              workflowId: workflow.id,
              companyId,
              leadId,
              customerId,
              triggerType: 'lead_created',
              triggerData: {
                executionId: execution.id,
                leadData,
                attribution,
                createdAt,
              },
            },
          });

          return { workflowId: workflow.id, executionId: execution.id, triggered: true };
        });
      })
    );

    return { 
      success: true, 
      leadId,
      companyId,
      workflowsProcessed: workflowResults.length,
      workflowResults 
    };
  }
);

// Helper function to evaluate workflow trigger conditions
async function evaluateWorkflowConditions(
  workflow: any, 
  leadData: any, 
  attribution: any
): Promise<boolean> {
  const conditions = workflow.trigger_conditions || {};
  
  // If no conditions specified, always trigger
  if (Object.keys(conditions).length === 0) {
    return true;
  }

  // Check pest type condition
  if (conditions.pest_types && conditions.pest_types.length > 0) {
    if (!conditions.pest_types.includes(leadData.pestType)) {
      return false;
    }
  }

  // Check urgency condition
  if (conditions.urgency_levels && conditions.urgency_levels.length > 0) {
    if (!conditions.urgency_levels.includes(leadData.urgency)) {
      return false;
    }
  }

  // Check lead source condition
  if (conditions.lead_sources && conditions.lead_sources.length > 0) {
    if (!conditions.lead_sources.includes(attribution.leadSource)) {
      return false;
    }
  }

  // Check UTM source condition
  if (conditions.utm_sources && conditions.utm_sources.length > 0) {
    if (!attribution.utmSource || !conditions.utm_sources.includes(attribution.utmSource)) {
      return false;
    }
  }

  // Check home size condition
  if (conditions.min_home_size && leadData.homeSize) {
    if (leadData.homeSize < conditions.min_home_size) {
      return false;
    }
  }

  if (conditions.max_home_size && leadData.homeSize) {
    if (leadData.homeSize > conditions.max_home_size) {
      return false;
    }
  }

  // All conditions met
  return true;
}