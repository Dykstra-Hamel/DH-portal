import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEvent } from '@/lib/inngest/client';

// POST test workflow execution
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workflowId: string }> }
) {
  try {
    const { id, workflowId } = await params;
    
    // Check for service role key authentication (development/testing bypass)
    const authHeader = request.headers.get('authorization');
    const isServiceRoleAuth = authHeader?.startsWith('Bearer ') && 
                             authHeader.split(' ')[1] === process.env.SUPABASE_SERVICE_ROLE_KEY &&
                             process.env.NODE_ENV !== 'production';

    let supabase;
    let user = null;

    if (isServiceRoleAuth) {
      // Use admin client for service role authentication
      supabase = createAdminClient();
      // Create a mock user for service role requests
      user = { id: 'service-role-user' };
    } else {
      // Use regular client for session authentication
      supabase = await createClient();
      
      // Get the current user from the session
      const {
        data: { user: sessionUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !sessionUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      user = sessionUser;

      // Check if user has access to this company
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', id)
        .single();

      // Also check if user is global admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isGlobalAdmin = profile?.role === 'admin';
      const hasCompanyAccess = userCompany && !userCompanyError;

      if (!isGlobalAdmin && !hasCompanyAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get test data from request body
    const testData = await request.json();
    const {
      sampleLead = {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '(555) 123-4567',
        pest_type: 'ants',
        urgency: 'high',
        lead_source: 'website'
      },
      triggerActualEvents = false
    } = testData;

    // Fetch workflow configuration
    const { data: workflow, error: workflowError } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('company_id', id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Fetch company information for template variables
    const { data: company } = await supabase
      .from('companies')
      .select('name, email, phone')
      .eq('id', id)
      .single();

    // Validate workflow configuration
    const validationResult = await validateWorkflow(workflow, supabase);
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: 'Workflow validation failed',
        validationErrors: validationResult.errors,
      }, { status: 400 });
    }

    // Execute workflow test
    const testResult = await executeWorkflowTest(workflow, sampleLead, company, supabase);
    const executionId = `test-${Date.now()}`;

    // Optionally trigger actual Inngest events
    let inngestEventId = null;
    if (triggerActualEvents) {
      try {
        console.log(`🚀 Triggering actual workflow/test event for workflow: ${workflow.name}`);
        
        await sendEvent({
          name: 'workflow/test',
          data: {
            workflowId: workflow.id,
            companyId: id,
            testData: {
              sampleLead,
              skipActualExecution: false
            },
            userId: user.id
          }
        });
        
        inngestEventId = `workflow-test-${executionId}`;
        console.log(`✅ Workflow test event sent to Inngest: ${inngestEventId}`);
      } catch (eventError) {
        console.error('❌ Failed to send Inngest event:', eventError);
        // Don't fail the test, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
      },
      testResult: {
        executionId,
        sampleData: sampleLead,
        steps: testResult.steps,
        summary: testResult.summary,
        estimatedDuration: testResult.estimatedDuration,
        emailPreviews: testResult.emailPreviews,
        inngestEventTriggered: triggerActualEvents,
        inngestEventId,
      },
    });
  } catch (error) {
    console.error('Error in workflow test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function validateWorkflow(workflow: any, supabase: any) {
  const errors: string[] = [];
  
  try {
    // Check if workflow has steps
    if (!workflow.workflow_steps || workflow.workflow_steps.length === 0) {
      errors.push('Workflow has no steps configured');
      return { valid: false, errors };
    }

    // Validate each step
    for (let i = 0; i < workflow.workflow_steps.length; i++) {
      const step = workflow.workflow_steps[i];
      const stepNumber = i + 1;

      // Validate email steps
      if (step.type === 'send_email') {
        if (!step.template_id) {
          errors.push(`Step ${stepNumber}: Email template not selected`);
          continue;
        }

        // Check if template exists and is active
        const { data: template, error } = await supabase
          .from('email_templates')
          .select('id, name, is_active, html_content, text_content')
          .eq('id', step.template_id)
          .eq('company_id', workflow.company_id)
          .single();

        if (error || !template) {
          errors.push(`Step ${stepNumber}: Email template not found`);
        } else if (!template.is_active) {
          errors.push(`Step ${stepNumber}: Email template "${template.name}" is inactive`);
        } else if (!template.html_content && !template.text_content) {
          errors.push(`Step ${stepNumber}: Email template "${template.name}" has no content`);
        }
      }

      // Validate wait steps
      if (step.type === 'wait') {
        if (!step.delay_minutes || step.delay_minutes < 1) {
          errors.push(`Step ${stepNumber}: Wait duration must be at least 1 minute`);
        }
        if (step.delay_minutes > 10080) { // 1 week
          errors.push(`Step ${stepNumber}: Wait duration cannot exceed 1 week (10,080 minutes)`);
        }
      }

      // Validate status update steps
      if (step.type === 'update_lead_status') {
        const validStatuses = ['new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'unqualified'];
        if (!step.new_status || !validStatuses.includes(step.new_status)) {
          errors.push(`Step ${stepNumber}: Invalid lead status "${step.new_status}"`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error validating workflow:', error);
    return { 
      valid: false, 
      errors: ['Workflow validation failed due to internal error'] 
    };
  }
}

async function executeWorkflowTest(workflow: any, sampleLead: any, company: any, supabase: any) {
  const steps: any[] = [];
  const emailPreviews: any[] = [];
  let totalDuration = 0;

  // Create template variables
  const templateVars = {
    lead_name: sampleLead.name,
    lead_email: sampleLead.email,
    lead_phone: sampleLead.phone,
    company_name: company?.name || 'Your Company',
    company_email: company?.email || 'info@yourcompany.com',
    company_phone: company?.phone || '(555) 000-0000',
    pest_type: sampleLead.pest_type,
    urgency: sampleLead.urgency,
    lead_source: sampleLead.lead_source,
    created_date: new Date().toLocaleDateString(),
  };

  for (let i = 0; i < workflow.workflow_steps.length; i++) {
    const step = workflow.workflow_steps[i];
    const stepNumber = i + 1;

    try {
      const stepResult: any = {
        stepNumber,
        type: step.type,
        status: 'success',
        duration: 0,
        timestamp: new Date(Date.now() + totalDuration * 60000).toISOString(),
      };

      switch (step.type) {
        case 'send_email':
          // Get email template
          const { data: template } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', step.template_id)
            .single();

          if (template) {
            // Process template with variables
            const processedSubject = replaceVariables(template.subject_line, templateVars);
            const processedHtml = replaceVariables(template.html_content || '', templateVars);
            const processedText = replaceVariables(template.text_content || '', templateVars);

            stepResult.templateName = template.name;
            stepResult.subject = processedSubject;
            stepResult.delay = step.delay_minutes || 0;
            stepResult.message = `Email "${template.name}" would be sent${step.delay_minutes ? ` after ${step.delay_minutes} minutes` : ' immediately'}`;

            // Add to email previews
            emailPreviews.push({
              stepNumber,
              templateName: template.name,
              subject: processedSubject,
              htmlContent: processedHtml,
              textContent: processedText,
              delay: step.delay_minutes || 0,
            });

            totalDuration += step.delay_minutes || 0;
          } else {
            stepResult.status = 'error';
            stepResult.message = 'Email template not found';
          }
          break;

        case 'wait':
          stepResult.duration = step.delay_minutes;
          stepResult.message = `Wait ${step.delay_minutes} minutes`;
          totalDuration += step.delay_minutes;
          break;

        case 'update_lead_status':
          stepResult.newStatus = step.new_status;
          stepResult.message = `Update lead status to "${step.new_status}"`;
          break;

        default:
          stepResult.message = `Execute ${step.type} step`;
      }

      steps.push(stepResult);
    } catch (stepError) {
      steps.push({
        stepNumber,
        type: step.type,
        status: 'error',
        message: `Step execution failed: ${stepError}`,
      });
    }
  }

  const summary = {
    totalSteps: workflow.workflow_steps.length,
    successfulSteps: steps.filter(s => s.status === 'success').length,
    failedSteps: steps.filter(s => s.status === 'error').length,
    emailSteps: steps.filter(s => s.type === 'send_email').length,
    estimatedTotalDuration: totalDuration,
  };

  return {
    steps,
    summary,
    estimatedDuration: totalDuration,
    emailPreviews,
  };
}

function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}