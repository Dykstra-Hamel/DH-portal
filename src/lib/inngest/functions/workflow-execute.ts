import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { formatDateOnly } from '@/lib/utils';

interface StepResult {
  stepIndex: number;
  stepType: string;
  completedAt: string;
  result: any;
  success: boolean;
}

export const workflowExecuteHandler = inngest.createFunction(
  {
    id: 'workflow-execute-handler',
    name: 'Execute Complete Workflow',
    retries: 3,
  },
  { event: 'workflow/execute' },
  async ({ event, step }) => {
    const { 
      executionId, 
      workflowId, 
      companyId, 
      leadId, 
      customerId, 
      leadData,
      attribution
    } = event.data;


    // Get workflow configuration and execution
    const { workflow, execution } = await step.run('get-workflow-and-execution', async () => {
      const supabase = createAdminClient();

      const { data: workflow, error: workflowError } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('company_id', companyId)
        .single();

      if (workflowError || !workflow) {
        throw new Error(`Workflow ${workflowId} not found: ${workflowError?.message}`);
      }

      const { data: execution, error: executionError } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (executionError || !execution) {
        throw new Error(`Execution ${executionId} not found: ${executionError?.message}`);
      }

      return { workflow, execution };
    });

    // Check if workflow is still active
    if (!workflow.is_active) {
      await step.run('mark-execution-cancelled', async () => {
        const supabase = createAdminClient();
        await supabase
          .from('automation_executions')
          .update({
            execution_status: 'cancelled',
            completed_at: new Date().toISOString(),
            error_message: 'Workflow deactivated during execution'
          })
          .eq('id', executionId);
      });
      return { success: false, reason: 'Workflow deactivated' };
    }

    const workflowSteps = workflow.workflow_steps || [];
    if (workflowSteps.length === 0) {
      await step.run('mark-empty-workflow-completed', async () => {
        const supabase = createAdminClient();
        await supabase
          .from('automation_executions')
          .update({
            execution_status: 'completed',
            completed_at: new Date().toISOString(),
            current_step: 'completed-0'
          })
          .eq('id', executionId);
      });
      return { success: true, completed: true, totalSteps: 0 };
    }

    // Execute all workflow steps in sequence
    const stepResults: StepResult[] = [];
    
    for (let stepIndex = 0; stepIndex < workflowSteps.length; stepIndex++) {
      const currentStep = workflowSteps[stepIndex];
      
      // Check if execution was cancelled before proceeding with this step
      const statusCheck = await step.run(`check-cancellation-${stepIndex}`, async () => {
        const supabase = createAdminClient();
        const { data: currentExecution } = await supabase
          .from('automation_executions')
          .select('execution_status, execution_data')
          .eq('id', executionId)
          .single();
          
        // Check both database status and cancellation flags
        const isCancelled = currentExecution?.execution_status === 'cancelled' ||
                           currentExecution?.execution_data?.cancellationProcessed === true;
          
        return {
          status: currentExecution?.execution_status,
          shouldContinue: !isCancelled,
          cancellationReason: isCancelled ? 'Database status or cancellation flag' : null
        };
      });
      
      if (!statusCheck.shouldContinue) {
        return {
          success: true,
          cancelled: true,
          cancelledAt: stepIndex,
          totalSteps: workflowSteps.length,
          message: 'Workflow execution stopped due to cancellation'
        };
      }
      
      // Execute the step
      const stepResult = await step.run(`execute-step-${stepIndex}`, async () => {
        const supabase = createAdminClient();
        
        
        let result = null;
        
        try {
          switch (currentStep.type) {
            case 'send_email':
              result = await executeEmailStep(currentStep, leadData, companyId, leadId, customerId);
              break;
            case 'delay':
            case 'wait':
              result = await executeDelayStep(currentStep);
              break;
            case 'conditional':
              result = await executeConditionalStep(currentStep, leadData, attribution);
              break;
            case 'update_lead_status':
              result = await executeUpdateLeadStatusStep(currentStep, leadId, companyId);
              break;
            default:
              throw new Error(`Unsupported step type: ${currentStep.type}`);
          }
          
          const stepData = {
            stepIndex,
            stepType: currentStep.type,
            completedAt: new Date().toISOString(),
            result,
            success: result?.success !== false,
          };
          
          // Update execution progress
          await supabase
            .from('automation_executions')
            .update({
              current_step: `step-${stepIndex + 1}`,
              execution_data: {
                ...execution.execution_data,
                stepIndex: stepIndex + 1,
                stepResults: [...stepResults, stepData]
              },
              execution_status: result?.success === false && currentStep.critical ? 'failed' : 'running'
            })
            .eq('id', executionId);
            
          return result;
          
        } catch (error) {
          console.error(`Error executing step ${stepIndex}:`, error);
          
          await supabase
            .from('automation_executions')
            .update({
              execution_status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            .eq('id', executionId);
            
          throw error;
        }
      });
      
      stepResults.push({
        stepIndex,
        stepType: currentStep.type,
        completedAt: new Date().toISOString(),
        result: stepResult,
        success: stepResult?.success !== false,
      });
      
      // Handle delay if this step requires it
      const stepDelayMinutes = (stepResult && 'delayMinutes' in stepResult ? stepResult.delayMinutes as number : null) || currentStep.delay_minutes || 0;
      const shouldDelay = 
        (stepResult && 'requiresDelay' in stepResult ? stepResult.requiresDelay as boolean : false) || 
        currentStep.type === 'wait' || 
        currentStep.type === 'delay' ||
        (currentStep.delay_minutes && currentStep.delay_minutes > 0);
        
      if (shouldDelay && stepDelayMinutes > 0) {
        await step.sleep('delay-step', `${stepDelayMinutes}m`);
        
        // Check for cancellation after sleep (common cancellation point)
        const postSleepCheck = await step.run(`check-cancellation-after-sleep-${stepIndex}`, async () => {
          const supabase = createAdminClient();
          const { data: currentExecution } = await supabase
            .from('automation_executions')
            .select('execution_status, execution_data')
            .eq('id', executionId)
            .single();
            
          // Check both database status and cancellation flags
          const isCancelled = currentExecution?.execution_status === 'cancelled' ||
                             currentExecution?.execution_data?.cancellationProcessed === true;
            
          return {
            status: currentExecution?.execution_status,
            shouldContinue: !isCancelled,
            cancellationReason: isCancelled ? 'Database status or cancellation flag' : null
          };
        });
        
        if (!postSleepCheck.shouldContinue) {
          return {
            success: true,
            cancelled: true,
            cancelledAt: stepIndex,
            cancelledAfter: 'delay',
            totalSteps: workflowSteps.length,
            message: 'Workflow execution stopped due to cancellation after delay'
          };
        }
      }
    }
    
    // Mark workflow as completed (but don't overwrite if already cancelled)
    await step.run('mark-workflow-completed', async () => {
      const supabase = createAdminClient();
      
      // Final check to prevent overwriting cancelled status
      const { data: finalCheck } = await supabase
        .from('automation_executions')
        .select('execution_status')
        .eq('id', executionId)
        .single();
        
      if (finalCheck?.execution_status === 'cancelled') {
        return { alreadyCancelled: true };
      }
      
      const { error: updateError } = await supabase
        .from('automation_executions')
        .update({
          execution_status: 'completed',
          completed_at: new Date().toISOString(),
          current_step: `completed-${workflowSteps.length}`,
          execution_data: {
            ...execution.execution_data,
            stepIndex: workflowSteps.length,
            completedSteps: workflowSteps.length,
            stepResults
          }
        })
        .eq('id', executionId)
        .neq('execution_status', 'cancelled'); // Extra safety - don't update if cancelled
        
      if (updateError) {
        console.error('Error marking workflow as completed:', updateError);
        throw new Error(`Failed to mark execution as completed: ${updateError.message}`);
      }
      
      return { completed: true };
    });
    
    return { 
      success: true, 
      completed: true, 
      totalSteps: workflowSteps.length,
      executedSteps: stepResults.length,
      stepResults
    };
  }
);

// Helper function to execute email steps
async function executeEmailStep(step: any, leadData: any, companyId: string, leadId: string, customerId: string) {
  const supabase = createAdminClient();

  // Get email template (check both possible field names)
  const templateId = step.email_template_id || step.template_id;
  
  if (!templateId) {
    throw new Error('No email template specified in workflow step');
  }

  const { data: template, error: templateError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', templateId)
    .eq('company_id', companyId)
    .single();

  if (templateError || !template) {
    console.error(`Template lookup error:`, { templateId, templateError });
    throw new Error(`Email template ${templateId} not found`);
  }

  // Get comprehensive lead data with plan and customer information
  const { data: fullLeadData } = await supabase
    .from('leads')
    .select(`
      *,
      customer:customers(
        id,
        first_name,
        last_name,
        email,
        phone,
        address,
        city,
        state,
        zip_code
      ),
      service_plans:selected_plan_id (
        plan_name,
        plan_description,
        plan_category,
        initial_price,
        recurring_price,
        billing_frequency,
        plan_features,
        plan_faqs,
        plan_image_url,
        highlight_badge,
        treatment_frequency,
        plan_disclaimer
      )
    `)
    .eq('id', leadId)
    .single();

  // Get company information for email sending
  const { data: company } = await supabase
    .from('companies')
    .select('name, website, email, phone')
    .eq('id', companyId)
    .single();
    
  // Get brand data for company logo and colors
  const { data: brandData } = await supabase
    .from('brands')
    .select('logo_url, primary_color_hex, secondary_color_hex')
    .eq('company_id', companyId)
    .single();
    
  // Get Google reviews data from company settings
  const { data: reviewsSetting } = await supabase
    .from('company_settings')
    .select('setting_value')
    .eq('company_id', companyId)
    .eq('setting_key', 'google_reviews_data')
    .single();
    
  let reviewsData = null;
  try {
    if (reviewsSetting?.setting_value && reviewsSetting.setting_value !== '{}') {
      reviewsData = JSON.parse(reviewsSetting.setting_value);
    }
  } catch (parseError) {
    console.error('Error parsing Google reviews data:', parseError);
  }

  // Get company logo override from company settings
  const { data: logoOverrideSetting } = await supabase
    .from('company_settings')
    .select('setting_value')
    .eq('company_id', companyId)
    .eq('setting_key', 'logo_override_url')
    .single();

  const logoOverrideUrl = logoOverrideSetting?.setting_value || '';

  // Prepare email variables with proper URL handling
  // Prioritize company logo override, then brand logo, then default
  const logoUrl = logoOverrideUrl || brandData?.logo_url || '/pcocentral-logo.png';
  
  
  // Helper function to format date (using timezone-safe formatter)
  const formatDate = (dateString: string) => {
    return formatDateOnly(dateString);
  };

  // Helper function to format plan features
  const formatPlanFeatures = (features: any) => {
    if (!features) return '';
    if (Array.isArray(features)) {
      const listItems = features.map(feature => `<li>${feature}</li>`).join('');
      return `<ul>${listItems}</ul>`;
    }
    return String(features);
  };

  // Helper function to format price
  const formatPrice = (price: number) => {
    if (!price) return '';
    return String(price);
  };

  // Helper function to format billing frequency to short form
  const formatBillingFrequency = (frequency: string) => {
    if (!frequency) return '';
    const frequencyMap = {
      'monthly': 'mo',
      'quarterly': 'qtr', 
      'semi-annually': '6mo',
      'annually': 'yr'
    };
    return frequencyMap[frequency as keyof typeof frequencyMap] || frequency;
  };

  // Helper function to format plan FAQs
  const formatPlanFaqs = (faqs: any) => {
    if (!faqs || !Array.isArray(faqs)) return '';
    const faqItems = faqs.map(faq => 
      `<div class="faq-item">
        <h3 class="faq-question">${faq.question}</h3>
        <p class="faq-answer">${faq.answer}</p>
      </div>`
    ).join('');
    return `<div class="faq-section">${faqItems}</div>`;
  };

  // Extract plan data
  const planData = fullLeadData?.service_plans;
  
  const emailVariables = {
    // Customer/Lead variables - with fallback to database data for partial leads
    customerName: leadData.customerName || 
                  (fullLeadData?.customer ? 
                   `${fullLeadData.customer.first_name || ''} ${fullLeadData.customer.last_name || ''}`.trim() : ''),
    firstName: fullLeadData?.customer?.first_name || leadData.customerName?.split(' ')[0] || '',
    lastName: fullLeadData?.customer?.last_name || leadData.customerName?.split(' ').slice(1).join(' ') || '',
    customerEmail: leadData.customerEmail || fullLeadData?.customer?.email || '',
    customerPhone: leadData.customerPhone || fullLeadData?.customer?.phone || '',
    
    // Company variables
    companyName: company?.name || 'Your Company',
    companyEmail: company?.email || '',
    companyPhone: company?.phone || '',
    companyWebsite: company?.website || '',
    companyLogo: logoUrl,
    
    // Brand colors
    brandPrimaryColor: brandData?.primary_color_hex || '',
    brandSecondaryColor: brandData?.secondary_color_hex || '',
    
    // Google Reviews
    googleRating: reviewsData?.rating ? reviewsData.rating.toString() : '',
    googleReviewCount: reviewsData?.reviewCount ? reviewsData.reviewCount.toString() : '',
    
    // Service/Lead details
    pestType: leadData.pestType,
    urgency: leadData.urgency,
    address: leadData.address,
    streetAddress: leadData.streetAddress || '',
    city: leadData.city || '',
    state: leadData.state || '',
    zipCode: leadData.zipCode || '',
    homeSize: leadData.homeSize,
    leadSource: fullLeadData?.lead_source || '',
    createdDate: formatDate(fullLeadData?.created_at),
    
    // Scheduling information
    requestedDate: formatDate(leadData.requestedDate || fullLeadData?.requested_date),
    requestedTime: leadData.requestedTime || fullLeadData?.requested_time || '',
    
    // Selected Plan Details (when available)
    selectedPlanName: planData?.plan_name || '',
    selectedPlanDescription: planData?.plan_description || '',
    selectedPlanCategory: planData?.plan_category || '',
    selectedPlanInitialPrice: formatPrice(planData?.initial_price),
    selectedPlanRecurringPrice: formatPrice(planData?.recurring_price),
    selectedPlanBillingFrequency: formatBillingFrequency(planData?.billing_frequency),
    selectedPlanFeatures: formatPlanFeatures(planData?.plan_features),
    selectedPlanFaqs: formatPlanFaqs(planData?.plan_faqs),
    selectedPlanImageUrl: planData?.plan_image_url || '',
    selectedPlanHighlightBadge: planData?.highlight_badge || '',
    selectedPlanTreatmentFrequency: planData?.treatment_frequency || '',
    selectedPlanDisclaimer: planData?.plan_disclaimer || '',
    
    // Recommended Plan
    recommendedPlanName: fullLeadData?.recommended_plan_name || '',
    
    // Legacy variables for backward compatibility
    leadId,
    customerId,
    ...step.email_variables, // Any additional variables from step config
  };

  // Replace variables in email content
  let htmlContent = template.html_content;
  let textContent = template.text_content;
  let subjectLine = template.subject_line;

  // Log original template content for debugging

  Object.entries(emailVariables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const replacement = String(value || '');
    
    
    htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), replacement);
    textContent = textContent.replace(new RegExp(placeholder, 'g'), replacement);
    subjectLine = subjectLine.replace(new RegExp(placeholder, 'g'), replacement);
    
  });

  // Send email using email API with enhanced error handling and fallback
  try {
    const emailApiUrl = process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`
      : 'http://localhost:3000/api/email/send';

    

    const emailResponse = await fetch(emailApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: leadData.customerEmail,
        subject: subjectLine,
        html: htmlContent,
        text: textContent,
        companyId,
        templateId: template.id,
        leadId,
        source: 'automation_workflow',
      }),
    });

    // Check email API response

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Email API error response:', errorData);
      throw new Error(`Email sending failed: ${emailResponse.status} - ${errorData}`);
    }

    let emailResult;
    try {
      const responseText = await emailResponse.text();
      if (responseText.trim()) {
        emailResult = JSON.parse(responseText);
      } else {
        emailResult = { success: true, messageId: `workflow-${Date.now()}` };
      }
    } catch (parseError) {
      console.error('Failed to parse email API response as JSON:', parseError);
      emailResult = { success: true, messageId: `workflow-${Date.now()}` };
    }
    
    
    return {
      success: true,
      emailSent: true,
      templateName: template.name,
      recipient: leadData.customerEmail,
      subject: subjectLine,
      emailId: emailResult.messageId,
      provider: emailResult.provider,
      sentAt: emailResult.sentAt,
    };

  } catch (error) {
    console.error('Error sending automation email:', {
      error: error instanceof Error ? error.message : error,
      recipient: leadData.customerEmail,
      template: template.name,
      leadId,
      companyId,
    });
    
    // Don't throw the error immediately - let's try to continue the workflow
    // and mark this step as failed but not the entire workflow
    return {
      success: false,
      emailSent: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
      templateName: template.name,
      recipient: leadData.customerEmail,
      subject: subjectLine,
    };
  }
}

// Helper function to execute delay steps
async function executeDelayStep(step: any) {
  const delayMinutes = step.delay_minutes || step.delay || 0;
  
  return {
    success: true,
    delayMinutes,
    requiresDelay: delayMinutes > 0,
  };
}

// Helper function to execute conditional steps
async function executeConditionalStep(step: any, leadData: any, attribution: any) {
  // Simple condition evaluation
  const condition = step.condition || {};
  
  let conditionMet = true;
  
  if (condition.field && condition.operator && condition.value) {
    const fieldValue = leadData[condition.field] || attribution[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        conditionMet = fieldValue === condition.value;
        break;
      case 'not_equals':
        conditionMet = fieldValue !== condition.value;
        break;
      case 'contains':
        conditionMet = String(fieldValue).includes(condition.value);
        break;
      default:
        console.warn(`Unknown condition operator: ${condition.operator}`);
    }
  }

  return {
    success: true,
    conditionMet,
    condition,
    fieldValue: leadData[condition.field] || attribution[condition.field],
  };
}

// Helper function to execute lead status update steps
async function executeUpdateLeadStatusStep(step: any, leadId: string, companyId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('leads')
    .update({
      lead_status: step.new_status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .eq('company_id', companyId);

  if (error) {
    throw new Error(`Failed to update lead status: ${error.message}`);
  }

  return {
    success: true,
    statusUpdated: true,
    newStatus: step.new_status,
    leadId,
  };
}