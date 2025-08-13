import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface WorkflowTestEvent {
  name: 'workflow/test';
  data: {
    workflowId: string;
    companyId: string;
    testData: {
      sampleLead: Record<string, any>;
      skipActualExecution?: boolean;
    };
    userId: string;
  };
}

export const workflowTestHandler = inngest.createFunction(
  {
    id: 'workflow-test-handler',
    name: 'Test Workflow Execution',
    retries: 1, // Minimal retries for testing
  },
  { event: 'workflow/test' },
  async ({ event, step }) => {
    const { workflowId, companyId, testData, userId } = event.data;
    const { sampleLead, skipActualExecution = true } = testData;
    
    console.log(`Testing workflow: ${workflowId} for company: ${companyId}`);

    // Step 1: Get workflow configuration
    const workflowConfig = await step.run('get-workflow-config', async () => {
      const supabase = createAdminClient();
      
      const { data: workflow, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('company_id', companyId)
        .single();

      if (error || !workflow) {
        throw new Error(`Workflow ${workflowId} not found: ${error?.message}`);
      }

      return workflow;
    });

    // Step 2: Get company and template data
    const contextData = await step.run('get-context-data', async () => {
      const supabase = createAdminClient();

      // Get company information
      const { data: company } = await supabase
        .from('companies')
        .select('name, email, phone')
        .eq('id', companyId)
        .single();

      // Get all email templates used in workflow
      const templateIds = workflowConfig.workflow_steps
        .filter((step: any) => step.type === 'send_email' && step.template_id)
        .map((step: any) => step.template_id);

      let templates: any[] = [];
      if (templateIds.length > 0) {
        const { data: templatesData } = await supabase
          .from('email_templates')
          .select('*')
          .eq('company_id', companyId)
          .in('id', templateIds);
        
        templates = templatesData || [];
      }

      return { company, templates };
    });

    // Step 3: Validate workflow before execution
    const validation = await step.run('validate-workflow', async () => {
      const errors: string[] = [];

      if (!workflowConfig.workflow_steps || workflowConfig.workflow_steps.length === 0) {
        errors.push('Workflow has no steps');
        return { valid: false, errors };
      }

      // Validate each step
      for (let i = 0; i < workflowConfig.workflow_steps.length; i++) {
        const workflowStep = workflowConfig.workflow_steps[i];
        const stepNumber = i + 1;

        if (workflowStep.type === 'send_email') {
          const template = contextData.templates.find(t => t.id === workflowStep.template_id);
          if (!template) {
            errors.push(`Step ${stepNumber}: Email template not found`);
          } else if (!template.is_active) {
            errors.push(`Step ${stepNumber}: Email template "${template.name}" is inactive`);
          }
        }

        if (workflowStep.type === 'wait' && (!workflowStep.delay_minutes || workflowStep.delay_minutes < 1)) {
          errors.push(`Step ${stepNumber}: Invalid wait duration`);
        }

        if (workflowStep.type === 'update_lead_status' && !workflowStep.new_status) {
          errors.push(`Step ${stepNumber}: No new status specified`);
        }
      }

      return { valid: errors.length === 0, errors };
    });

    if (!validation.valid) {
      return {
        success: false,
        error: 'Workflow validation failed',
        errors: validation.errors,
        workflowId,
        companyId,
      };
    }

    // Step 4: Execute workflow steps in test mode
    const testExecution = await step.run('execute-test-workflow', async () => {
      const results: any[] = [];
      let totalDelay = 0;

      // Create template variables
      const templateVars = {
        lead_name: sampleLead.name || 'Test User',
        lead_email: sampleLead.email || 'test@example.com',
        lead_phone: sampleLead.phone || '(555) 123-4567',
        company_name: contextData.company?.name || 'Test Company',
        company_email: contextData.company?.email || 'info@testcompany.com',
        company_phone: contextData.company?.phone || '(555) 000-0000',
        pest_type: sampleLead.pest_type || 'ants',
        urgency: sampleLead.urgency || 'medium',
        lead_source: sampleLead.lead_source || 'website',
        created_date: new Date().toLocaleDateString(),
      };

      for (let i = 0; i < workflowConfig.workflow_steps.length; i++) {
        const workflowStep = workflowConfig.workflow_steps[i];
        const stepNumber = i + 1;

        const stepResult: any = {
          stepNumber,
          type: workflowStep.type,
          status: 'completed',
          executedAt: new Date(Date.now() + totalDelay * 60000).toISOString(),
          testMode: true,
        };

        try {
          switch (workflowStep.type) {
            case 'send_email':
              const template = contextData.templates.find(t => t.id === workflowStep.template_id);
              if (template) {
                // Process email template with variables
                const subject = replaceTemplateVariables(template.subject_line, templateVars);
                const htmlContent = replaceTemplateVariables(template.html_content || '', templateVars);
                const textContent = replaceTemplateVariables(template.text_content || '', templateVars);

                stepResult.templateId = template.id;
                stepResult.templateName = template.name;
                stepResult.subject = subject;
                stepResult.delay = workflowStep.delay_minutes || 0;
                stepResult.emailPreview = {
                  subject,
                  htmlContent,
                  textContent,
                  recipientEmail: sampleLead.email || 'test@example.com',
                };

                if (skipActualExecution) {
                  stepResult.message = `TEST MODE: Email "${template.name}" would be sent to ${sampleLead.email || 'test@example.com'}`;
                } else {
                  stepResult.message = `Email "${template.name}" sent successfully`;
                }

                totalDelay += workflowStep.delay_minutes || 0;
              } else {
                throw new Error('Email template not found');
              }
              break;

            case 'wait':
              stepResult.waitDuration = workflowStep.delay_minutes;
              stepResult.message = `Waited ${workflowStep.delay_minutes} minutes`;
              totalDelay += workflowStep.delay_minutes;
              break;

            case 'update_lead_status':
              stepResult.previousStatus = sampleLead.status || 'new';
              stepResult.newStatus = workflowStep.new_status;
              stepResult.message = `Lead status updated from "${sampleLead.status || 'new'}" to "${workflowStep.new_status}"`;
              break;

            case 'assign_lead':
              stepResult.assignedTo = workflowStep.assign_to_user_id || 'unassigned';
              stepResult.message = `Lead assigned to user ${workflowStep.assign_to_user_id || 'system'}`;
              break;

            default:
              stepResult.message = `Executed ${workflowStep.type} step`;
          }
        } catch (stepError: any) {
          stepResult.status = 'failed';
          stepResult.error = stepError.message;
          stepResult.message = `Step failed: ${stepError.message}`;
        }

        results.push(stepResult);
      }

      return {
        steps: results,
        totalSteps: workflowConfig.workflow_steps.length,
        successfulSteps: results.filter(r => r.status === 'completed').length,
        failedSteps: results.filter(r => r.status === 'failed').length,
        estimatedDuration: totalDelay,
        templateVariables: templateVars,
      };
    });

    // Step 5: Store test results (optional)
    await step.run('store-test-results', async () => {
      if (!skipActualExecution) {
        const supabase = createAdminClient();
        
        // Store test execution record
        const { data: testRecord } = await supabase
          .from('workflow_test_runs')
          .insert({
            workflow_id: workflowId,
            company_id: companyId,
            user_id: userId,
            test_data: sampleLead,
            execution_results: testExecution,
            success: testExecution.failedSteps === 0,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        return testRecord?.id;
      }
      return null;
    });

    return {
      success: true,
      workflowId,
      companyId,
      testExecutionId: `test-${workflowId}-${Date.now()}`,
      workflow: {
        id: workflowConfig.id,
        name: workflowConfig.name,
        description: workflowConfig.description,
        type: workflowConfig.workflow_type,
        trigger: workflowConfig.trigger_type,
      },
      execution: testExecution,
      sampleData: sampleLead,
      testMode: skipActualExecution,
    };
  }
);

function replaceTemplateVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  });
  return result;
}

// Export the event type for use in other files
export type { WorkflowTestEvent };