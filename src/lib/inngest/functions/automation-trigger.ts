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

    // Step 3: Process workflow steps
    const workflowSteps = workflowConfig.workflow_steps || [];
    const stepResults: any[] = [];

    for (let i = 0; i < workflowSteps.length; i++) {
      const workflowStep = workflowSteps[i];
      
      // Check if execution has been cancelled before processing each step
      const cancellationCheck = await step.run(`check-cancellation-${i}`, async () => {
        const supabase = createAdminClient();
        
        const { data: execution } = await supabase
          .from('automation_executions')
          .select('execution_status')
          .eq('id', executionId)
          .single();
        
        return execution?.execution_status === 'cancelled';
      });

      if (cancellationCheck) {
        console.log(`Execution ${executionId} was cancelled, stopping workflow at step ${i}`);
        
        // Update execution status to reflect cancellation
        await step.run('update-cancelled-status', async () => {
          const supabase = createAdminClient();
          
          await supabase
            .from('automation_executions')
            .update({ 
              execution_status: 'cancelled',
              current_step: `cancelled_at_step_${i}`,
              completed_at: new Date().toISOString(),
              execution_data: {
                ...triggerData,
                stepResults,
                cancellationReason: 'cancelled_during_execution',
                cancelledAtStep: i,
                totalSteps: workflowSteps.length
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', executionId);
        });

        return { 
          success: true, 
          cancelled: true,
          workflowId,
          executionId,
          stepsCompleted: stepResults.length,
          cancelledAtStep: i,
          totalSteps: workflowSteps.length,
          stepResults 
        };
      }
      
      const stepResult = await step.run(`process-step-${i}-${workflowStep.id}`, async () => {
        return await processWorkflowStep(
          workflowStep,
          workflowConfig,
          triggerData,
          executionId,
          companyId
        );
      });

      stepResults.push(stepResult);

      // If step failed and is marked as required, stop processing
      if (!stepResult.success && workflowStep.required !== false) {
        console.error(`Required step failed: ${workflowStep.id}`, stepResult.error);
        break;
      }

      // Check for cancellation before delay (if there's a delay)
      if (workflowStep.delay_minutes && i < workflowSteps.length - 1) {
        // Check cancellation before starting delay
        const preDelayCheck = await step.run(`check-cancellation-before-delay-${i}`, async () => {
          const supabase = createAdminClient();
          
          const { data: execution } = await supabase
            .from('automation_executions')
            .select('execution_status')
            .eq('id', executionId)
            .single();
          
          return execution?.execution_status === 'cancelled';
        });

        if (preDelayCheck) {
          console.log(`Execution ${executionId} was cancelled before delay, stopping workflow`);
          
          await step.run('update-cancelled-during-delay-status', async () => {
            const supabase = createAdminClient();
            
            await supabase
              .from('automation_executions')
              .update({ 
                execution_status: 'cancelled',
                current_step: `cancelled_before_delay_step_${i}`,
                completed_at: new Date().toISOString(),
                execution_data: {
                  ...triggerData,
                  stepResults,
                  cancellationReason: 'cancelled_before_delay',
                  cancelledAtStep: i,
                  totalSteps: workflowSteps.length
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', executionId);
          });

          return { 
            success: true, 
            cancelled: true,
            workflowId,
            executionId,
            stepsCompleted: stepResults.length,
            cancelledBeforeDelay: true,
            stepResults 
          };
        }

        // Sleep for the delay period
        await step.sleep(`delay-after-step-${i}`, `${workflowStep.delay_minutes}m`);
      }
    }

    // Step 4: Update execution status to completed
    await step.run('complete-execution', async () => {
      const supabase = createAdminClient();
      
      const allSuccessful = stepResults.every(result => result.success);
      const finalStatus = allSuccessful ? 'completed' : 'failed';
      
      await supabase
        .from('automation_executions')
        .update({ 
          execution_status: finalStatus,
          current_step: 'completed',
          completed_at: new Date().toISOString(),
          execution_data: {
            ...triggerData,
            stepResults,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', executionId);
    });

    return { 
      success: true, 
      workflowId,
      executionId,
      stepsProcessed: stepResults.length,
      stepResults 
    };
  }
);

// Process individual workflow step
async function processWorkflowStep(
  step: any,
  workflowConfig: any,
  triggerData: any,
  executionId: string,
  companyId: string
): Promise<{ success: boolean; stepId: string; error?: string; data?: any }> {
  try {
    switch (step.type) {
      case 'send_email':
        return await processSendEmailStep(step, workflowConfig, triggerData, executionId, companyId);
      
      case 'wait':
        // Wait steps are handled by the main function with step.sleep
        return { success: true, stepId: step.id, data: { waited: step.duration } };
      
      case 'update_lead_status':
        return await processUpdateLeadStatusStep(step, triggerData, companyId);
      
      case 'assign_lead':
        return await processAssignLeadStep(step, triggerData, companyId);
      
      case 'send_notification':
        return await processSendNotificationStep(step, workflowConfig, triggerData, companyId);
      
      case 'conditional':
        return await processConditionalStep(step, triggerData);
      
      case 'make_call':
        return await processMakeCallStep(step, workflowConfig, triggerData, companyId);
      
      case 'archive_call':
        return await processArchiveCallStep(step, triggerData, companyId);
      
      default:
        console.warn(`Unknown step type: ${step.type}`);
        return { success: false, stepId: step.id, error: `Unknown step type: ${step.type}` };
    }
  } catch (error) {
    console.error(`Error processing step ${step.id}:`, error);
    return { 
      success: false, 
      stepId: step.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send email step processor
async function processSendEmailStep(
  step: any,
  workflowConfig: any,
  triggerData: any,
  executionId: string,
  companyId: string
): Promise<{ success: boolean; stepId: string; error?: string; data?: any }> {
  const { leadData, formData } = triggerData;
  const templateId = step.template_id;
  
  if (!templateId) {
    return { success: false, stepId: step.id, error: 'No template ID specified' };
  }

  // Resolve customer email with fallbacks for partial leads
  const customerEmail = leadData?.customerEmail || 
                       leadData?.email || 
                       formData?.customerEmail || 
                       formData?.email ||
                       formData?.contactInfo?.email ||
                       '';

  // Resolve customer name with fallbacks for partial leads  
  const customerName = leadData?.customerName || 
                      leadData?.name || 
                      formData?.customerName ||
                      formData?.name ||
                      formData?.contactInfo?.name ||
                      (formData?.contactInfo?.firstName && formData?.contactInfo?.lastName 
                        ? `${formData.contactInfo.firstName} ${formData.contactInfo.lastName}` 
                        : '') ||
                      '';

  // Validate that we have an email address for partial leads
  if (!customerEmail) {
    return { 
      success: false, 
      stepId: step.id, 
      error: 'No customer email available for partial lead automation. Email may not be captured yet in the form flow.' 
    };
  }

  // Send immediately
  await inngest.send({
    name: 'email/scheduled',
    data: {
      companyId,
      templateId,
      recipientEmail: customerEmail,
      recipientName: customerName,
      leadId: triggerData.leadId,
      customerId: triggerData.customerId,
      variables: {
        ...leadData,
        ...formData, // Include form data for partial leads
        customerEmail,
        customerName,
        companyName: workflowConfig.company_name || 'Your Company',
      },
      scheduledFor: new Date().toISOString(),
      workflowId: workflowConfig.id,
      stepId: step.id,
    },
  });

  return { success: true, stepId: step.id, data: { emailScheduled: true, recipientEmail: customerEmail } };
}

// Update lead status step processor
async function processUpdateLeadStatusStep(
  step: any,
  triggerData: any,
  companyId: string
): Promise<{ success: boolean; stepId: string; error?: string; data?: any }> {
  const newStatus = step.new_status;
  const leadId = triggerData.leadId;
  
  if (!newStatus || !leadId) {
    return { success: false, stepId: step.id, error: 'Missing new_status or leadId' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('leads')
    .update({ 
      lead_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .eq('company_id', companyId);

  if (error) {
    return { success: false, stepId: step.id, error: error.message };
  }

  return { success: true, stepId: step.id, data: { newStatus } };
}

// Assign lead step processor
async function processAssignLeadStep(
  step: any,
  triggerData: any,
  companyId: string
): Promise<{ success: boolean; stepId: string; error?: string; data?: any }> {
  const assignToUserId = step.assign_to_user_id;
  const leadId = triggerData.leadId;
  
  if (!assignToUserId || !leadId) {
    return { success: false, stepId: step.id, error: 'Missing assign_to_user_id or leadId' };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('leads')
    .update({ 
      assigned_to: assignToUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .eq('company_id', companyId);

  if (error) {
    return { success: false, stepId: step.id, error: error.message };
  }

  return { success: true, stepId: step.id, data: { assignedTo: assignToUserId } };
}

// Send notification step processor
async function processSendNotificationStep(
  step: any,
  workflowConfig: any,
  triggerData: any,
  companyId: string
): Promise<{ success: boolean; stepId: string; error?: string; data?: any }> {
  // This would integrate with your existing Slack notification system
  // For now, just log the notification
  console.log(`Notification step: ${step.id}`, { 
    type: step.notification_type,
    message: step.message,
    triggerData 
  });
  
  return { success: true, stepId: step.id, data: { notificationSent: true } };
}

// Conditional step processor
async function processConditionalStep(
  step: any,
  triggerData: any
): Promise<{ success: boolean; stepId: string; error?: string; data?: any }> {
  const condition = step.condition;
  const { leadData } = triggerData;
  
  // Simple condition evaluation (can be extended)
  let conditionMet = false;
  
  switch (condition.type) {
    case 'pest_type_equals':
      conditionMet = leadData.pestType === condition.value;
      break;
    case 'urgency_equals':
      conditionMet = leadData.urgency === condition.value;
      break;
    case 'home_size_greater_than':
      conditionMet = leadData.homeSize && leadData.homeSize > condition.value;
      break;
    default:
      conditionMet = true; // Default to true for unknown conditions
  }
  
  return { 
    success: true, 
    stepId: step.id, 
    data: { 
      conditionMet,
      condition: condition.type,
      value: condition.value 
    } 
  };
}

// Make call step processor
async function processMakeCallStep(
  step: any,
  workflowConfig: any,
  triggerData: any,
  companyId: string
): Promise<{ success: boolean; stepId: string; error?: string; data?: any }> {
  const { leadData } = triggerData;
  
  // Validate required customer data
  if (!leadData.customerPhone) {
    return { 
      success: false, 
      stepId: step.id, 
      error: 'Customer phone number is required for make_call step' 
    };
  }

  if (!leadData.customerName && !leadData.customerFirstName) {
    return { 
      success: false, 
      stepId: step.id, 
      error: 'Customer name is required for make_call step' 
    };
  }

  try {
    // Call the existing Retell AI integration
    const callPayload = {
      firstName: leadData.customerFirstName || leadData.customerName?.split(' ')[0] || 'Customer',
      lastName: leadData.customerLastName || leadData.customerName?.split(' ').slice(1).join(' ') || '',
      email: leadData.customerEmail || `${leadData.customerId}@noemail.com`,
      phone: leadData.customerPhone,
      message: leadData.customerMessage || `Automated follow-up call for ${leadData.pestType || 'pest control'} inquiry`,
      pestType: leadData.pestType,
      urgency: leadData.urgency,
      selectedPlan: leadData.selectedPlan,
      recommendedPlan: leadData.recommendedPlan,
      streetAddress: leadData.streetAddress,
      city: leadData.city,
      state: leadData.state,
      zipCode: leadData.zipCode,
      companyId: companyId
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/retell-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callPayload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error(`Make call step failed for step ${step.id}:`, result.error);
      return { 
        success: false, 
        stepId: step.id, 
        error: result.error || 'Failed to initiate call' 
      };
    }

    return { 
      success: true, 
      stepId: step.id, 
      data: { 
        callId: result.callId,
        callStatus: result.callStatus,
        customerPhone: leadData.customerPhone.slice(0, -4) + '****', // Log partial phone for privacy
        callType: step.call_type || 'immediate'
      } 
    };

  } catch (error) {
    console.error(`Error in make call step ${step.id}:`, error);
    return { 
      success: false, 
      stepId: step.id, 
      error: error instanceof Error ? error.message : 'Unknown error occurred during call initiation' 
    };
  }
}

// Archive call step processor
async function processArchiveCallStep(
  step: any,
  triggerData: any,
  companyId: string
): Promise<{ success: boolean; stepId: string; error?: string; data?: any }> {
  const callId = triggerData.callRecord?.call_id;
  
  if (!callId) {
    return { 
      success: false, 
      stepId: step.id, 
      error: 'Call ID is required for archive_call step' 
    };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('call_records')
      .update({ 
        archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq('call_id', callId)
      .eq('company_id', companyId);

    if (error) {
      console.error(`Error archiving call ${callId}:`, error);
      return { 
        success: false, 
        stepId: step.id, 
        error: error.message 
      };
    }

    console.log(`Successfully archived call ${callId} for company ${companyId}`);
    return { 
      success: true, 
      stepId: step.id, 
      data: { 
        archivedCallId: callId,
        archivedAt: new Date().toISOString() 
      } 
    };

  } catch (error) {
    console.error(`Error in archive call step ${step.id}:`, error);
    return { 
      success: false, 
      stepId: step.id, 
      error: error instanceof Error ? error.message : 'Unknown error occurred during call archival' 
    };
  }
}

