import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { triggerWorkflowForCadenceStep } from '@/lib/cadence/trigger-workflow-step';
import { formatDateOnly, toE164PhoneNumber } from '@/lib/utils';
import {
  fetchCompanyBusinessHours,
  isBusinessHours,
  getNextBusinessHourSlot,
} from '@/lib/campaigns/business-hours';
import { generateLeadTrackingTags } from '@/lib/email/variables';
import {
  generateCampaignLandingUrl,
  formatDiscount,
} from '@/lib/campaign-utils';
import { isPhoneSuppressed } from '@/lib/suppression';
import { getGeminiClient } from '@/lib/ai/gemini-client';

interface StepResult {
  stepIndex: number;
  stepType: string;
  completedAt: string;
  result: any;
  success: boolean;
}

const WORKFLOW_ACTION_TO_CONTACT_TYPE: Record<string, string> = {
  send_email: 'email',
  send_sms: 'text_message',
  make_call: 'outbound_call',
};

async function logWorkflowActivity(
  supabase: ReturnType<typeof createAdminClient>,
  leadId: string | null | undefined,
  companyId: string,
  stepType: string,
  smsConversationId?: string | null
): Promise<void> {
  const contactType = WORKFLOW_ACTION_TO_CONTACT_TYPE[stepType];
  if (!leadId || !contactType) return;
  const metadata: Record<string, string> = {
    contact_type: contactType,
    contact_outcome: 'automation_sent',
    source: 'workflow_automation',
  };
  if (smsConversationId) {
    metadata.sms_conversation_id = smsConversationId;
  }
  await supabase.from('activity_log').insert({
    company_id: companyId,
    entity_type: 'lead',
    entity_id: leadId,
    activity_type: 'contact_made',
    user_id: null,
    notes: null,
    metadata,
  });
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
      attribution,
      triggerType,
    } = event.data;

    // Query partial lead data directly if this is a partial lead automation
    const partialLeadData = await step.run(
      'get-partial-lead-data',
      async () => {
        if (leadData?.partialLeadId) {
          const supabase = createAdminClient();

          const { data: partialLead, error } = await supabase
            .from('partial_leads')
            .select('*')
            .eq('id', leadData.partialLeadId)
            .single();

          if (error) {
            console.error('Error fetching partial lead:', error);
            return null;
          }

          return partialLead;
        }
        return null;
      }
    );

    // Get workflow configuration and execution
    const { workflow, execution } = await step.run(
      'get-workflow-and-execution',
      async () => {
        const supabase = createAdminClient();

        const { data: workflow, error: workflowError } = await supabase
          .from('automation_workflows')
          .select('*')
          .eq('id', workflowId)
          .eq('company_id', companyId)
          .single();

        if (workflowError || !workflow) {
          throw new Error(
            `Workflow ${workflowId} not found: ${workflowError?.message}`
          );
        }

        const { data: execution, error: executionError } = await supabase
          .from('automation_executions')
          .select('*')
          .eq('id', executionId)
          .single();

        if (executionError || !execution) {
          throw new Error(
            `Execution ${executionId} not found: ${executionError?.message}`
          );
        }

        return { workflow, execution };
      }
    );

    // Check if workflow is still active
    if (!workflow.is_active) {
      await step.run('mark-execution-cancelled', async () => {
        const supabase = createAdminClient();
        await supabase
          .from('automation_executions')
          .update({
            execution_status: 'cancelled',
            completed_at: new Date().toISOString(),
            error_message: 'Workflow deactivated during execution',
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
            current_step: 'completed-0',
          })
          .eq('id', executionId);
      });
      return { success: true, completed: true, totalSteps: 0 };
    }

    // Execute all workflow steps in sequence
    const stepResults: StepResult[] = [];
    let branchCancellation: object | null = null;

    for (let stepIndex = 0; stepIndex < workflowSteps.length; stepIndex++) {
      const currentStep = workflowSteps[stepIndex];

      // Check if execution was cancelled before proceeding with this step
      const statusCheck = await step.run(
        `check-cancellation-${stepIndex}`,
        async () => {
          const supabase = createAdminClient();
          const { data: currentExecution } = await supabase
            .from('automation_executions')
            .select('execution_status, execution_data')
            .eq('id', executionId)
            .single();

          // Check both database status and cancellation flags
          let isCancelled =
            currentExecution?.execution_status === 'cancelled' ||
            currentExecution?.execution_data?.cancellationProcessed === true;
          let cancellationReason = isCancelled
            ? 'Database status or cancellation flag'
            : null;

          // Additional check: For partial lead workflows, check if lead has been converted
          if (
            !isCancelled &&
            triggerType === 'partial_lead_automation' &&
            leadData?.partialLeadId
          ) {
            console.log(
              'Checking partial lead conversion status for workflow step:',
              {
                partialLeadId: leadData.partialLeadId,
                stepIndex,
                executionId,
              }
            );

            const { data: partialLead, error } = await supabase
              .from('partial_leads')
              .select('converted_to_lead_id')
              .eq('id', leadData.partialLeadId)
              .single();

            if (error) {
              console.error('Error checking partial lead conversion:', error);
              // Continue workflow if we can't check - don't fail on this error
            } else if (partialLead?.converted_to_lead_id) {
              isCancelled = true;
              cancellationReason = `Partial lead converted to full lead (ID: ${partialLead.converted_to_lead_id})`;
              console.log(
                '🛑 Cancelling partial lead workflow - lead converted:',
                {
                  partialLeadId: leadData.partialLeadId,
                  convertedToLeadId: partialLead.converted_to_lead_id,
                  stepIndex,
                  executionId,
                }
              );

              // Update execution status to cancelled
              await supabase
                .from('automation_executions')
                .update({
                  execution_status: 'cancelled',
                  completed_at: new Date().toISOString(),
                  execution_data: {
                    ...currentExecution?.execution_data,
                    cancellationReason: cancellationReason,
                    cancellationProcessed: true,
                    cancelledAtStep: stepIndex,
                  },
                })
                .eq('id', executionId);
            }
          }

          return {
            status: currentExecution?.execution_status,
            shouldContinue: !isCancelled,
            cancellationReason,
          };
        }
      );

      if (!statusCheck.shouldContinue) {
        // Save completed steps to database before returning
        await step.run('save-steps-before-cancellation', async () => {
          const supabase = createAdminClient();

          // Get current execution data to preserve existing fields
          const { data: currentExecution } = await supabase
            .from('automation_executions')
            .select('execution_data')
            .eq('id', executionId)
            .single();

          // Update with completed steps
          await supabase
            .from('automation_executions')
            .update({
              execution_data: {
                ...currentExecution?.execution_data,
                stepResults: stepResults,
                completedSteps: stepResults.length,
                cancelledAtStep: stepIndex,
              },
            })
            .eq('id', executionId);

          return { stepsSaved: stepResults.length };
        });

        // Send workflow completion event for campaign tracking
        await inngest.send({
          name: 'workflow/completed',
          data: {
            executionId,
            workflowId,
            companyId,
            triggerType,
            success: false,
            cancelled: true,
            cancellationReason: statusCheck.cancellationReason,
          },
        });

        return {
          success: true,
          cancelled: true,
          cancelledAt: stepIndex,
          totalSteps: workflowSteps.length,
          completedSteps: stepResults.length,
          cancellationReason: statusCheck.cancellationReason,
          message: `Workflow execution stopped due to cancellation: ${statusCheck.cancellationReason}`,
        };
      }

      // Apply delay BEFORE executing the step (so "send email after 5 min" waits first)
      const preStepDelayMinutes = currentStep.delay_minutes || 0;
      if (preStepDelayMinutes > 0) {
        // Check if this is a campaign execution and if it should respect business hours
        const shouldRespectBusinessHours = await step.run(
          `check-business-hours-requirement-${stepIndex}`,
          async () => {
            if (
              triggerType === 'campaign' &&
              execution.execution_data?.campaignId
            ) {
              const supabase = createAdminClient();
              const { data: campaign } = await supabase
                .from('campaigns')
                .select('respect_business_hours')
                .eq('id', execution.execution_data.campaignId)
                .single();

              return campaign?.respect_business_hours ?? false;
            }
            return false;
          }
        );

        // Calculate when the delay will end
        const delayEndTime = new Date(
          Date.now() + preStepDelayMinutes * 60 * 1000
        );

        if (shouldRespectBusinessHours) {
          const businessHours = await fetchCompanyBusinessHours(companyId);

          if (!isBusinessHours(delayEndTime, businessHours)) {
            console.log(
              `Workflow ${executionId} step ${stepIndex}: Delay would end outside business hours`,
              {
                originalDelayEnd: delayEndTime.toISOString(),
                delayMinutes: preStepDelayMinutes,
              }
            );

            const nextBusinessSlot = getNextBusinessHourSlot(
              new Date(),
              businessHours
            );
            const adjustedDelayMs = nextBusinessSlot.getTime() - Date.now();
            const adjustedDelayMinutes = Math.ceil(adjustedDelayMs / 60000);

            console.log(
              `Workflow ${executionId} step ${stepIndex}: Adjusted delay to respect business hours`,
              {
                originalDelayMinutes: preStepDelayMinutes,
                adjustedDelayMinutes,
                nextBusinessSlot: nextBusinessSlot.toISOString(),
              }
            );

            await step.sleep(
              `delay-before-step-${stepIndex}`,
              `${adjustedDelayMinutes}m`
            );
          } else {
            await step.sleep(
              `delay-before-step-${stepIndex}`,
              `${preStepDelayMinutes}m`
            );
          }
        } else {
          await step.sleep(
            `delay-before-step-${stepIndex}`,
            `${preStepDelayMinutes}m`
          );
        }

        // Check for cancellation after sleep
        const postSleepCheck = await step.run(
          `check-cancellation-after-sleep-${stepIndex}`,
          async () => {
            const supabase = createAdminClient();
            const { data: currentExecution } = await supabase
              .from('automation_executions')
              .select('execution_status, execution_data')
              .eq('id', executionId)
              .single();

            const isCancelled =
              currentExecution?.execution_status === 'cancelled' ||
              currentExecution?.execution_data?.cancellationProcessed === true;

            return {
              status: currentExecution?.execution_status,
              shouldContinue: !isCancelled,
              cancellationReason: isCancelled
                ? 'Database status or cancellation flag'
                : null,
            };
          }
        );

        if (!postSleepCheck.shouldContinue) {
          await step.run(
            `save-steps-after-delay-cancellation-${stepIndex}`,
            async () => {
              const supabase = createAdminClient();
              const { data: currentExecution } = await supabase
                .from('automation_executions')
                .select('execution_data')
                .eq('id', executionId)
                .single();

              await supabase
                .from('automation_executions')
                .update({
                  execution_data: {
                    ...currentExecution?.execution_data,
                    stepResults: stepResults,
                    completedSteps: stepResults.length,
                    cancelledAtStep: stepIndex,
                    cancelledAfterDelay: true,
                  },
                })
                .eq('id', executionId);

              return { stepsSaved: stepResults.length };
            }
          );

          return {
            success: true,
            cancelled: true,
            cancelledAt: stepIndex,
            cancelledAfter: 'delay',
            totalSteps: workflowSteps.length,
            completedSteps: stepResults.length,
            message:
              'Workflow execution stopped due to cancellation after delay',
          };
        }
      }

      // Execute the step
      const stepResult = await step.run(
        `execute-step-${stepIndex}`,
        async () => {
          const supabase = createAdminClient();

          let result = null;

          try {
            switch (currentStep.type) {
              case 'send_email':
                result = await executeEmailStep(
                  currentStep,
                  leadData,
                  companyId,
                  leadId,
                  customerId,
                  attribution,
                  partialLeadData,
                  executionId,
                  execution?.execution_data?.campaignId,
                  workflowId
                );
                break;
              case 'send_sms':
                result = await executeSMSStep(
                  currentStep,
                  leadData,
                  companyId,
                  leadId,
                  customerId,
                  attribution,
                  partialLeadData,
                  executionId,
                  execution?.execution_data?.campaignId,
                  workflowId
                );
                break;
              case 'make_call':
                result = await executeMakeCallStep(
                  currentStep,
                  leadData,
                  companyId,
                  leadId,
                  customerId,
                  executionId
                );
                break;
              case 'delay':
              case 'wait':
                result = await executeDelayStep(currentStep);
                break;
              case 'conditional':
                result = await executeConditionalStep(
                  currentStep,
                  leadData,
                  attribution,
                  leadId
                );
                break;
              case 'update_lead_status':
                result = await executeUpdateLeadStatusStep(
                  currentStep,
                  leadId,
                  companyId
                );
                break;
              default:
                throw new Error(`Unsupported step type: ${currentStep.type}`);
            }

            // Log to communication log for lead-linked action steps
            if (result?.success !== false) {
              await logWorkflowActivity(
                supabase,
                leadId,
                companyId,
                currentStep.type,
                currentStep.type === 'send_sms' ? result?.conversationId : undefined
              );
            }

            const stepData = {
              stepIndex,
              stepType: currentStep.type,
              completedAt: new Date().toISOString(),
              result,
              success: result?.success !== false,
            };

            // Update execution progress
            const newStatus =
              result?.success === false && currentStep.critical
                ? 'failed'
                : 'running';

            await supabase
              .from('automation_executions')
              .update({
                current_step: `step-${stepIndex + 1}`,
                execution_data: {
                  ...execution.execution_data,
                  stepIndex: stepIndex + 1,
                  stepResults: [...stepResults, stepData],
                },
                execution_status: newStatus,
              })
              .eq('id', executionId);

            // Sync campaign_executions status if this is a campaign execution
            if (triggerType === 'campaign') {
              await supabase
                .from('campaign_executions')
                .update({ execution_status: newStatus })
                .eq('automation_execution_id', executionId);
            }

            return result;
          } catch (error) {
            console.error(`Error executing step ${stepIndex}:`, error);

            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';

            await supabase
              .from('automation_executions')
              .update({
                execution_status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: errorMessage,
              })
              .eq('id', executionId);

            // Sync campaign_executions status if this is a campaign execution
            if (triggerType === 'campaign') {
              await supabase
                .from('campaign_executions')
                .update({
                  execution_status: 'failed',
                  completed_at: new Date().toISOString(),
                })
                .eq('automation_execution_id', executionId);
            }

            // Send workflow completion event for campaign tracking
            await inngest.send({
              name: 'workflow/completed',
              data: {
                executionId,
                workflowId,
                companyId,
                triggerType,
                success: false,
                failed: true,
                error: errorMessage,
              },
            });

            throw error;
          }
        }
      );

      stepResults.push({
        stepIndex,
        stepType: currentStep.type,
        completedAt: new Date().toISOString(),
        result: stepResult,
        success: stepResult?.success !== false,
      });

      // Execute branch steps if this is a conditional step
      const conditionalResult = stepResult as any;

      // MULTI-BRANCH MODE
      if (currentStep.type === 'conditional' && conditionalResult?.isMultiBranch === true) {
        const branches: any[] = currentStep.branches || [];
        const selectedBranch =
          branches.find((b: any) => !b.isDefault && b.id === conditionalResult.matchedBranchId)
          ?? branches.find((b: any) => b.isDefault);

        const branchSteps: any[] = selectedBranch?.steps || [];
        const branchLabel: string = selectedBranch?.id || 'default';

        for (let branchIdx = 0; branchIdx < branchSteps.length; branchIdx++) {
          const branchStep = branchSteps[branchIdx];

          const branchStatusCheck = await step.run(
            `check-cancellation-${stepIndex}-${branchLabel}-branch-${branchIdx}`,
            async () => {
              const supabase = createAdminClient();
              const { data: currentExecution } = await supabase
                .from('automation_executions')
                .select('execution_status, execution_data')
                .eq('id', executionId)
                .single();

              let isCancelled =
                currentExecution?.execution_status === 'cancelled' ||
                currentExecution?.execution_data?.cancellationProcessed === true;
              let cancellationReason = isCancelled ? 'Database status or cancellation flag' : null;

              if (!isCancelled && triggerType === 'partial_lead_automation' && leadData?.partialLeadId) {
                const { data: partialLead } = await supabase
                  .from('partial_leads')
                  .select('converted_to_lead_id')
                  .eq('id', leadData.partialLeadId)
                  .single();

                if (partialLead?.converted_to_lead_id) {
                  isCancelled = true;
                  cancellationReason = `Partial lead converted to full lead (ID: ${partialLead.converted_to_lead_id})`;
                  await supabase
                    .from('automation_executions')
                    .update({
                      execution_status: 'cancelled',
                      completed_at: new Date().toISOString(),
                      execution_data: {
                        ...currentExecution?.execution_data,
                        cancellationReason,
                        cancellationProcessed: true,
                        cancelledAtStep: `${stepIndex}-${branchLabel}-branch-${branchIdx}`,
                      },
                    })
                    .eq('id', executionId);
                }
              }

              return { shouldContinue: !isCancelled, cancellationReason };
            }
          );

          if (!branchStatusCheck.shouldContinue) {
            await step.run(
              `save-steps-before-branch-cancellation-${stepIndex}-multi`,
              async () => {
                const supabase = createAdminClient();
                const { data: currentExecution } = await supabase
                  .from('automation_executions')
                  .select('execution_data')
                  .eq('id', executionId)
                  .single();
                await supabase
                  .from('automation_executions')
                  .update({
                    execution_data: {
                      ...currentExecution?.execution_data,
                      stepResults,
                      completedSteps: stepResults.length,
                      cancelledAtStep: `${stepIndex}-${branchLabel}-branch-${branchIdx}`,
                    },
                  })
                  .eq('id', executionId);
                return { stepsSaved: stepResults.length };
              }
            );

            await inngest.send({
              name: 'workflow/completed',
              data: { executionId, workflowId, companyId, triggerType, success: false, cancelled: true, cancellationReason: branchStatusCheck.cancellationReason },
            });

            branchCancellation = {
              success: true,
              cancelled: true,
              cancelledAt: `${stepIndex}-${branchLabel}-branch-${branchIdx}`,
              cancellationReason: branchStatusCheck.cancellationReason,
            };
            break;
          }

          const branchResult = await step.run(
            `execute-step-${stepIndex}-${branchLabel}-branch-${branchIdx}`,
            async () => {
              const supabase = createAdminClient();
              let result: any;
              switch (branchStep.type) {
                case 'send_email':
                  result = await executeEmailStep(branchStep, leadData, companyId, leadId, customerId, attribution, partialLeadData, executionId, execution?.execution_data?.campaignId, workflowId);
                  break;
                case 'send_sms':
                  result = await executeSMSStep(branchStep, leadData, companyId, leadId, customerId, attribution, partialLeadData, executionId, execution?.execution_data?.campaignId, workflowId);
                  break;
                case 'make_call':
                  result = await executeMakeCallStep(branchStep, leadData, companyId, leadId, customerId, executionId);
                  break;
                case 'wait':
                case 'delay':
                  return await executeDelayStep(branchStep);
                case 'update_lead_status':
                  return await executeUpdateLeadStatusStep(branchStep, leadId, companyId);
                case 'archive_call':
                  return { success: true, archived: true, reason: branchStep.archive_reason };
                default:
                  return { success: true, skipped: true };
              }
              if (result?.success !== false) {
                await logWorkflowActivity(
                  supabase,
                  leadId,
                  companyId,
                  branchStep.type,
                  branchStep.type === 'send_sms' ? result?.conversationId : undefined
                );
              }
              return result;
            }
          );

          stepResults.push({
            stepIndex,
            stepType: `${selectedBranch?.label || 'default'}_branch:${branchStep.type}`,
            completedAt: new Date().toISOString(),
            result: branchResult,
            success: branchResult?.success !== false,
          });

          const branchDelay = branchStep.delay_minutes || 0;
          if (branchDelay > 0) {
            await step.sleep(
              `delay-step-${stepIndex}-${branchLabel}-branch-${branchIdx}`,
              `${branchDelay}m`
            );

            const postDelayCheck = await step.run(
              `check-cancellation-post-delay-${stepIndex}-${branchLabel}-branch-${branchIdx}`,
              async () => {
                const supabase = createAdminClient();
                const { data: currentExecution } = await supabase
                  .from('automation_executions')
                  .select('execution_status, execution_data')
                  .eq('id', executionId)
                  .single();
                const isCancelled =
                  currentExecution?.execution_status === 'cancelled' ||
                  currentExecution?.execution_data?.cancellationProcessed === true;
                return { shouldContinue: !isCancelled };
              }
            );

            if (!postDelayCheck.shouldContinue) {
              branchCancellation = { success: true, cancelled: true, cancelledAfterDelay: true };
              break;
            }
          }
        }
      }

      // LEGACY BINARY MODE
      if (currentStep.type === 'conditional' && conditionalResult?.conditionMet !== undefined) {
        const branchPath = conditionalResult.conditionMet ? 'true' : 'false';
        const branchSteps: any[] = conditionalResult.conditionMet
          ? (currentStep.true_steps || [])
          : (currentStep.false_steps || []);

        for (let branchIdx = 0; branchIdx < branchSteps.length; branchIdx++) {
          const branchStep = branchSteps[branchIdx];

          // Cancellation check before each branch step
          const branchStatusCheck = await step.run(
            `check-cancellation-${stepIndex}-${branchPath}-branch-${branchIdx}`,
            async () => {
              const supabase = createAdminClient();
              const { data: currentExecution } = await supabase
                .from('automation_executions')
                .select('execution_status, execution_data')
                .eq('id', executionId)
                .single();

              let isCancelled =
                currentExecution?.execution_status === 'cancelled' ||
                currentExecution?.execution_data?.cancellationProcessed === true;
              let cancellationReason = isCancelled
                ? 'Database status or cancellation flag'
                : null;

              if (
                !isCancelled &&
                triggerType === 'partial_lead_automation' &&
                leadData?.partialLeadId
              ) {
                const { data: partialLead } = await supabase
                  .from('partial_leads')
                  .select('converted_to_lead_id')
                  .eq('id', leadData.partialLeadId)
                  .single();

                if (partialLead?.converted_to_lead_id) {
                  isCancelled = true;
                  cancellationReason = `Partial lead converted to full lead (ID: ${partialLead.converted_to_lead_id})`;
                  await supabase
                    .from('automation_executions')
                    .update({
                      execution_status: 'cancelled',
                      completed_at: new Date().toISOString(),
                      execution_data: {
                        ...currentExecution?.execution_data,
                        cancellationReason,
                        cancellationProcessed: true,
                        cancelledAtStep: `${stepIndex}-${branchPath}-branch-${branchIdx}`,
                      },
                    })
                    .eq('id', executionId);
                }
              }

              return { shouldContinue: !isCancelled, cancellationReason };
            }
          );

          if (!branchStatusCheck.shouldContinue) {
            await step.run(
              `save-steps-before-branch-cancellation-${stepIndex}`,
              async () => {
                const supabase = createAdminClient();
                const { data: currentExecution } = await supabase
                  .from('automation_executions')
                  .select('execution_data')
                  .eq('id', executionId)
                  .single();
                await supabase
                  .from('automation_executions')
                  .update({
                    execution_data: {
                      ...currentExecution?.execution_data,
                      stepResults,
                      completedSteps: stepResults.length,
                      cancelledAtStep: `${stepIndex}-${branchPath}-branch-${branchIdx}`,
                    },
                  })
                  .eq('id', executionId);
                return { stepsSaved: stepResults.length };
              }
            );

            await inngest.send({
              name: 'workflow/completed',
              data: {
                executionId,
                workflowId,
                companyId,
                triggerType,
                success: false,
                cancelled: true,
                cancellationReason: branchStatusCheck.cancellationReason,
              },
            });

            branchCancellation = {
              success: true,
              cancelled: true,
              cancelledAt: `${stepIndex}-${branchPath}-branch-${branchIdx}`,
              cancellationReason: branchStatusCheck.cancellationReason,
            };
            break;
          }

          // Execute the branch step
          const branchResult = await step.run(
            `execute-step-${stepIndex}-${branchPath}-branch-${branchIdx}`,
            async () => {
              const supabase = createAdminClient();
              let result: any;
              switch (branchStep.type) {
                case 'send_email':
                  result = await executeEmailStep(
                    branchStep,
                    leadData,
                    companyId,
                    leadId,
                    customerId,
                    attribution,
                    partialLeadData,
                    executionId,
                    execution?.execution_data?.campaignId,
                    workflowId
                  );
                  break;
                case 'send_sms':
                  result = await executeSMSStep(
                    branchStep,
                    leadData,
                    companyId,
                    leadId,
                    customerId,
                    attribution,
                    partialLeadData,
                    executionId,
                    execution?.execution_data?.campaignId,
                    workflowId
                  );
                  break;
                case 'make_call':
                  result = await executeMakeCallStep(
                    branchStep,
                    leadData,
                    companyId,
                    leadId,
                    customerId,
                    executionId
                  );
                  break;
                case 'wait':
                case 'delay':
                  return await executeDelayStep(branchStep);
                case 'update_lead_status':
                  return await executeUpdateLeadStatusStep(
                    branchStep,
                    leadId,
                    companyId
                  );
                case 'archive_call':
                  return {
                    success: true,
                    archived: true,
                    reason: branchStep.archive_reason,
                  };
                default:
                  return { success: true, skipped: true };
              }
              if (result?.success !== false) {
                await logWorkflowActivity(
                  supabase,
                  leadId,
                  companyId,
                  branchStep.type,
                  branchStep.type === 'send_sms' ? result?.conversationId : undefined
                );
              }
              return result;
            }
          );

          stepResults.push({
            stepIndex,
            stepType: `${branchPath}_branch:${branchStep.type}`,
            completedAt: new Date().toISOString(),
            result: branchResult,
            success: branchResult?.success !== false,
          });

          // Handle delay for branch steps
          const branchDelay = branchStep.delay_minutes || 0;
          if (branchDelay > 0) {
            await step.sleep(
              `delay-step-${stepIndex}-${branchPath}-branch-${branchIdx}`,
              `${branchDelay}m`
            );

            // Post-delay cancellation check
            const postDelayCheck = await step.run(
              `check-cancellation-post-delay-${stepIndex}-${branchPath}-branch-${branchIdx}`,
              async () => {
                const supabase = createAdminClient();
                const { data: currentExecution } = await supabase
                  .from('automation_executions')
                  .select('execution_status, execution_data')
                  .eq('id', executionId)
                  .single();
                const isCancelled =
                  currentExecution?.execution_status === 'cancelled' ||
                  currentExecution?.execution_data?.cancellationProcessed === true;
                return { shouldContinue: !isCancelled };
              }
            );

            if (!postDelayCheck.shouldContinue) {
              branchCancellation = {
                success: true,
                cancelled: true,
                cancelledAfterDelay: true,
              };
              break;
            }
          }
        }
      }

      if (branchCancellation) return branchCancellation;
    }

    // Mark workflow as completed (but don't overwrite if already cancelled)
    await step.run('mark-workflow-completed', async () => {
      const supabase = createAdminClient();

      // Final check to prevent overwriting cancelled status
      const { data: finalCheck } = await supabase
        .from('automation_executions')
        .select('execution_status, cadence_step_id, cadence_lead_id')
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
            stepResults,
          },
        })
        .eq('id', executionId)
        .neq('execution_status', 'cancelled'); // Extra safety - don't update if cancelled

      if (updateError) {
        console.error('Error marking workflow as completed:', updateError);
        throw new Error(
          `Failed to mark execution as completed: ${updateError.message}`
        );
      }

      // Sync campaign_executions status if this is a campaign execution
      if (triggerType === 'campaign') {
        await supabase
          .from('campaign_executions')
          .update({
            execution_status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('automation_execution_id', executionId)
          .neq('execution_status', 'cancelled');
      }

      // If this workflow was triggered by a cadence step, mark that step complete
      // and advance the cadence to the next step.
      if (finalCheck?.cadence_step_id && finalCheck?.cadence_lead_id) {
        try {
          // 1. Mark the trigger_workflow cadence step as complete in lead_cadence_progress
          await supabase
            .from('lead_cadence_progress')
            .upsert(
              {
                lead_id: finalCheck.cadence_lead_id,
                cadence_step_id: finalCheck.cadence_step_id,
                completed_at: new Date().toISOString(),
              },
              { onConflict: 'lead_id,cadence_step_id' }
            );

          // 2. Get the next incomplete cadence step
          try {
            const { data: nextStepRows } = await supabase.rpc(
              'get_next_incomplete_cadence_step',
              { p_lead_id: finalCheck.cadence_lead_id }
            );
            const nextCadenceStep = nextStepRows?.[0];

            if (nextCadenceStep?.step_id) {
              // workflow_id may not be returned by the RPC — fetch directly if needed
              if (nextCadenceStep.action_type === 'trigger_workflow' && !nextCadenceStep.workflow_id) {
                const { data: stepRow } = await supabase
                  .from('sales_cadence_steps')
                  .select('workflow_id')
                  .eq('id', nextCadenceStep.step_id)
                  .single();
                nextCadenceStep.workflow_id = stepRow?.workflow_id || null;
              }

              if (nextCadenceStep.action_type === 'trigger_workflow' && nextCadenceStep.workflow_id) {
                // Next step is also a trigger_workflow — fire it directly
                const { data: leadForWorkflow } = await supabase
                  .from('leads')
                  .select('company_id, customer_id')
                  .eq('id', finalCheck.cadence_lead_id)
                  .single();

                await triggerWorkflowForCadenceStep({
                  leadId: finalCheck.cadence_lead_id,
                  companyId: leadForWorkflow?.company_id ?? companyId,
                  customerId: leadForWorkflow?.customer_id ?? customerId ?? null,
                  cadenceStepId: nextCadenceStep.step_id,
                  workflowId: nextCadenceStep.workflow_id,
                  cadenceId: nextCadenceStep.cadence_id,
                });
              } else {
                // Next step requires user action — create its task
                const { data: leadForTask } = await supabase
                  .from('leads')
                  .select('assigned_to, company_id, customer:customers(first_name, last_name)')
                  .eq('id', finalCheck.cadence_lead_id)
                  .single();
                const { data: assignment } = await supabase
                  .from('lead_cadence_assignments')
                  .select('started_at')
                  .eq('lead_id', finalCheck.cadence_lead_id)
                  .is('completed_at', null)
                  .maybeSingle();
                if (leadForTask?.assigned_to && assignment?.started_at) {
                  const customerData = leadForTask.customer as { first_name?: string; last_name?: string } | null;
                  const customerName =
                    `${customerData?.first_name || ''} ${customerData?.last_name || ''}`.trim() ||
                    'Unknown Customer';
                  await supabase.rpc('create_task_for_cadence_step', {
                    p_lead_id: finalCheck.cadence_lead_id,
                    p_cadence_step_id: nextCadenceStep.step_id,
                    p_assigned_to: leadForTask.assigned_to,
                    p_company_id: leadForTask.company_id,
                    p_customer_name: customerName,
                    p_started_at: assignment.started_at,
                  });
                }
              }
            } else {
              // No next step — cadence is complete
              await supabase
                .from('lead_cadence_assignments')
                .update({ completed_at: new Date().toISOString() })
                .eq('lead_id', finalCheck.cadence_lead_id)
                .is('completed_at', null);
            }
          } catch (advanceError) {
            console.error('Error advancing cadence after workflow completion:', advanceError);
            // Don't throw — workflow completed successfully
          }
        } catch (cadenceError) {
          console.error(
            'Error advancing cadence after workflow completion:',
            cadenceError
          );
          // Don't throw — workflow completed successfully even if cadence advancement fails
        }
      }

      // Send workflow completion event for campaign tracking
      await inngest.send({
        name: 'workflow/completed',
        data: {
          executionId,
          workflowId,
          companyId,
          triggerType,
          success: true,
        },
      });

      return { completed: true };
    });

    return {
      success: true,
      completed: true,
      totalSteps: workflowSteps.length,
      executedSteps: stepResults.length,
      stepResults,
    };
  }
);

// Helper function to execute email steps
async function executeEmailStep(
  step: any,
  leadData: any,
  companyId: string,
  leadId: string,
  customerId: string,
  attribution: any,
  partialLeadData: any = null,
  executionId: string,
  campaignId?: string,
  workflowId?: string
) {
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
    .select(
      `
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
      service_address:service_addresses(
        id,
        street_address,
        city,
        state,
        zip_code,
        apartment_unit,
        address_line_2,
        address_type
      ),
      service_plans:selected_plan_id (
        plan_name,
        plan_description,
        plan_category,
        initial_price,
        initial_discount,
        recurring_price,
        billing_frequency,
        plan_features,
        plan_faqs,
        plan_image_url,
        highlight_badge,
        treatment_frequency,
        plan_disclaimer
      )
    `
    )
    .eq('id', leadId)
    .single();

  // Get company information for email sending
  const { data: company } = await supabase
    .from('companies')
    .select('name, website, email, phone, slug')
    .eq('id', companyId)
    .single();

  // Get brand data for company logo and colors
  const { data: brandData } = await supabase
    .from('brands')
    .select('logo_url, primary_color_hex, secondary_color_hex, signature_url')
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
    if (
      reviewsSetting?.setting_value &&
      reviewsSetting.setting_value !== '{}'
    ) {
      reviewsData = JSON.parse(reviewsSetting.setting_value);
    }
  } catch (parseError) {
    console.error('Error parsing Google reviews data:', parseError);
  }

  // Get campaign data if campaignId exists
  let campaign = null;
  let campaignLandingPage = null;
  if (campaignId) {
    console.log(
      `[Campaign Email] Fetching campaign data for campaignId: ${campaignId}`
    );
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select(
        'id, campaign_id, name, discount_id, company_discounts!discount_id(discount_type, discount_value)'
      )
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      console.error(
        `[Campaign Email] Error fetching campaign data:`,
        campaignError
      );
    }

    campaign = campaignData;
    console.log(
      `[Campaign Email] Campaign data (full):`,
      JSON.stringify(campaign, null, 2)
    );

    // Fetch campaign landing page data for hero image
    if (campaign?.id) {
      const { data: landingPageData, error: landingPageError } = await supabase
        .from('campaign_landing_pages')
        .select('hero_image_url')
        .eq('campaign_id', campaign.id)
        .maybeSingle();

      if (landingPageError) {
        console.error(
          `[Campaign Email] Error fetching landing page data:`,
          landingPageError
        );
      } else {
        campaignLandingPage = landingPageData;
        console.log(
          `[Campaign Email] Landing page hero image:`,
          landingPageData?.hero_image_url || 'none'
        );
      }
    }
  } else {
    console.log(`[Campaign Email] No campaignId provided to workflow`);
  }

  // Get company slug for campaign landing URL
  const companySlug = company?.slug || '';
  const useVanityUrl = true; // Default to vanity URLs for campaigns

  if (campaignId && companySlug) {
    console.log(`[Campaign Email] Using company slug: ${companySlug}`);
  } else if (campaignId && !companySlug) {
    console.warn(
      `[Campaign Email] Company has no slug set for companyId: ${companyId}`
    );
  }

  // Get company logo override from company settings
  const { data: logoOverrideSetting } = await supabase
    .from('company_settings')
    .select('setting_value')
    .eq('company_id', companyId)
    .eq('setting_key', 'logo_override_url')
    .single();

  const logoOverrideUrl = logoOverrideSetting?.setting_value || '';

  // Comprehensive customer email resolution with fallbacks for partial leads
  const customerEmail =
    leadData.customerEmail ||
    leadData.email ||
    leadData.customerInfo?.email ||
    leadData.contactInfo?.email ||
    fullLeadData?.customer?.email ||
    '';

  // Prepare email variables with proper URL handling
  // Prioritize company logo override, then brand logo, then default
  const logoUrl =
    logoOverrideUrl || brandData?.logo_url || '/pcocentral-logo.png';

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
      monthly: 'mo',
      quarterly: 'qtr',
      'semi-annually': '6mo',
      annually: 'yr',
    };
    return frequencyMap[frequency as keyof typeof frequencyMap] || frequency;
  };

  // Helper function to format plan FAQs
  const formatPlanFaqs = (faqs: any) => {
    if (!faqs || !Array.isArray(faqs)) return '';
    const faqItems = faqs
      .map(
        faq =>
          `<div class="faq-item">
        <h3 class="faq-question">${faq.question}</h3>
        <p class="faq-answer">${faq.answer}</p>
      </div>`
      )
      .join('');
    return `<div class="faq-section">${faqItems}</div>`;
  };

  // NOTE: Unsubscribe footer is now automatically injected by the sendEmail() function
  // These variables are kept for backward compatibility with older templates that may
  // manually reference {{unsubscribeUrl}} or {{unsubscribeLink}} in their content.
  // New emails will have the footer automatically appended regardless of these variables.
  const unsubscribeUrl = '';
  const unsubscribeLink = '';

  // Extract plan data with fallbacks for partial leads
  const planData = fullLeadData?.service_plans || leadData.selectedPlan;
  const recommendedPlanData = leadData.recommendedPlan;

  const emailVariables = {
    // Customer/Lead variables - with comprehensive fallbacks for partial leads
    customerName:
      leadData.customerName ||
      leadData.name ||
      leadData.customerInfo?.name ||
      leadData.contactInfo?.name ||
      (leadData.contactInfo?.firstName && leadData.contactInfo?.lastName
        ? `${leadData.contactInfo.firstName} ${leadData.contactInfo.lastName}`
        : '') ||
      (fullLeadData?.customer
        ? `${fullLeadData.customer.first_name || ''} ${fullLeadData.customer.last_name || ''}`.trim()
        : ''),
    firstName:
      leadData.firstName ||
      leadData.customerInfo?.firstName ||
      leadData.contactInfo?.firstName ||
      fullLeadData?.customer?.first_name ||
      leadData.customerName?.split(' ')[0] ||
      '',
    lastName:
      leadData.lastName ||
      leadData.customerInfo?.lastName ||
      leadData.contactInfo?.lastName ||
      fullLeadData?.customer?.last_name ||
      leadData.customerName?.split(' ').slice(1).join(' ') ||
      '',
    customerEmail: customerEmail,
    customerPhone:
      leadData.customerPhone ||
      leadData.phone ||
      leadData.customerInfo?.phone ||
      leadData.contactInfo?.phone ||
      fullLeadData?.customer?.phone ||
      '',

    // Company variables
    companyName: company?.name || 'Your Company',
    companyEmail: company?.email || '',
    companyPhone: company?.phone || '',
    companyWebsite: company?.website || '',
    companyLogo: logoUrl,
    companySignature: brandData?.signature_url || '',

    // Brand colors
    brandPrimaryColor: brandData?.primary_color_hex || '',
    brandSecondaryColor: brandData?.secondary_color_hex || '',

    // Google Reviews
    googleRating: reviewsData?.rating ? reviewsData.rating.toString() : '',
    googleReviewCount: reviewsData?.reviewCount
      ? reviewsData.reviewCount.toString()
      : '',

    // Service/Lead details with enhanced partial lead support
    pestType: leadData.pestType || leadData.selectedPest || '',
    urgency: leadData.urgency || '',
    address:
      fullLeadData?.service_address?.street_address ||
      fullLeadData?.customer?.address ||
      partialLeadData?.form_data?.address ||
      leadData.address ||
      '',
    streetAddress:
      fullLeadData?.service_address?.street_address ||
      fullLeadData?.customer?.address ||
      partialLeadData?.form_data?.address ||
      leadData.address ||
      '',
    city:
      fullLeadData?.service_address?.city ||
      fullLeadData?.customer?.city ||
      partialLeadData?.form_data?.city ||
      leadData.city ||
      '',
    state:
      fullLeadData?.service_address?.state ||
      fullLeadData?.customer?.state ||
      partialLeadData?.form_data?.state ||
      leadData.state ||
      '',
    zipCode:
      fullLeadData?.service_address?.zip_code ||
      fullLeadData?.customer?.zip_code ||
      partialLeadData?.form_data?.zipCode ||
      leadData.zipCode ||
      '',
    homeSize: leadData.homeSize,
    leadSource:
      fullLeadData?.lead_source ||
      leadData.leadSource ||
      'partial_lead_automation',
    createdDate: formatDate(fullLeadData?.created_at),

    // Additional variables from partial lead forms
    selectedPlanPrice:
      formatPrice(leadData.selectedPlan?.recurring_price) || '',
    offerPrice: formatPrice(leadData.offerPrice) || '',

    // Scheduling information
    requestedDate: formatDate(
      leadData.requestedDate || fullLeadData?.requested_date
    ),
    requestedTime: leadData.requestedTime || fullLeadData?.requested_time || '',

    // Selected Plan Details with comprehensive fallbacks for partial leads
    selectedPlanName:
      planData?.plan_name || leadData.selectedPlan?.plan_name || '',
    selectedPlanDescription:
      planData?.plan_description ||
      leadData.selectedPlan?.plan_description ||
      '',
    selectedPlanCategory:
      planData?.plan_category || leadData.selectedPlan?.plan_category || '',
    selectedPlanInitialPrice: formatPrice(
      planData?.initial_price || leadData.selectedPlan?.initial_price
    ),
    selectedPlanNormalInitialPrice: formatPrice(
      (planData?.initial_price || leadData.selectedPlan?.initial_price || 0) +
        (planData?.initial_discount ||
          leadData.selectedPlan?.initial_discount ||
          0)
    ),
    selectedPlanRecurringPrice: formatPrice(
      planData?.recurring_price || leadData.selectedPlan?.recurring_price
    ),
    selectedPlanBillingFrequency: formatBillingFrequency(
      planData?.billing_frequency || leadData.selectedPlan?.billing_frequency
    ),
    selectedPlanFeatures: formatPlanFeatures(
      planData?.plan_features || leadData.selectedPlan?.plan_features
    ),
    selectedPlanFaqs: formatPlanFaqs(
      planData?.plan_faqs || leadData.selectedPlan?.plan_faqs
    ),
    selectedPlanImageUrl:
      planData?.plan_image_url || leadData.selectedPlan?.plan_image_url || '',
    selectedPlanHighlightBadge:
      planData?.highlight_badge || leadData.selectedPlan?.highlight_badge || '',
    selectedPlanTreatmentFrequency:
      planData?.treatment_frequency ||
      leadData.selectedPlan?.treatment_frequency ||
      '',
    selectedPlanDisclaimer:
      planData?.plan_disclaimer || leadData.selectedPlan?.plan_disclaimer || '',

    // Recommended Plan with fallbacks for partial leads
    recommendedPlanName:
      fullLeadData?.recommended_plan_name ||
      recommendedPlanData?.plan_name ||
      '',

    // Session and Attribution Variables - Use direct DB query for partial leads
    partialLeadSessionId:
      partialLeadData?.session_id ||
      leadData.sessionId ||
      leadData.session_id ||
      leadData.partialLeadSessionId ||
      attribution?.sessionId ||
      attribution?.session_id ||
      leadData.id ||
      'unknown',
    pageUrl:
      attribution?.page_url ||
      leadData.pageUrl ||
      leadData.attribution_data?.page_url ||
      company?.website ||
      '#',

    // Quote Variables (not populated in workflow context)
    quoteUrl: '',
    quoteId: '',
    quoteTotalInitialPrice: '',
    quoteTotalRecurringPrice: '',
    quoteLineItems: '',
    quotePestConcerns: '',
    quoteHomeSize: '',
    quoteYardSize: '',

    // Campaign Variables
    campaignLandingUrl:
      campaignId && customerId && companySlug
        ? generateCampaignLandingUrl(
            companySlug,
            campaign?.campaign_id || campaignId,
            customerId,
            useVanityUrl
          )
        : '',
    campaignId: campaign?.campaign_id || '',
    campaignName: campaign?.name || '',
    campaignDiscountText:
      campaign?.company_discounts &&
      Array.isArray(campaign.company_discounts) &&
      campaign.company_discounts.length > 0
        ? formatDiscount(campaign.company_discounts[0])
        : campaign?.company_discounts &&
            !Array.isArray(campaign.company_discounts)
          ? formatDiscount(campaign.company_discounts)
          : '',
    campaignHeroImage: campaignLandingPage?.hero_image_url || '',
    createLeadLink:
      campaignId && customerId
        ? generateLeadTrackingTags(campaignId, customerId, undefined, companyId)
        : '',
    // Unsubscribe variables
    unsubscribeUrl,
    unsubscribeLink,

    // Legacy variables for backward compatibility
    leadId,
    customerId,
    ...step.email_variables, // Any additional variables from step config
  };

  // Log campaign variable population for debugging
  if (campaignId) {
    console.log(`[Campaign Email] Variable population:`, {
      campaignId,
      customerId,
      companySlug,
      campaignLandingUrl: emailVariables.campaignLandingUrl,
      createLeadLink: emailVariables.createLeadLink,
      campaignName: emailVariables.campaignName,
      campaignDiscountText: emailVariables.campaignDiscountText,
      campaignHeroImage: emailVariables.campaignHeroImage,
    });
  }

  // Calculate the session ID - prioritize DB query for partial leads
  const resolvedSessionId =
    partialLeadData?.session_id ||
    leadData.sessionId ||
    leadData.session_id ||
    leadData.partialLeadSessionId ||
    attribution?.sessionId ||
    attribution?.session_id ||
    leadData.id ||
    'unknown';

  // Validate required fields for email sending
  if (!customerEmail || !customerEmail.trim()) {
    console.error('Email sending failed - no customer email available', {
      leadId,
      companyId,
      templateId: template.id,
      triggerType: 'workflow_email_step',
      leadData: {
        customerEmail: leadData.customerEmail,
        email: leadData.email,
        customerInfo: leadData.customerInfo,
        contactInfo: leadData.contactInfo,
      },
    });

    return {
      success: false,
      emailSent: false,
      error:
        'No customer email available for sending. Email may not be captured yet in the form flow.',
      templateName: template.name,
      recipient: customerEmail,
      subject: template.subject_line,
    };
  }

  // Check if email is suppressed (unsubscribed)
  const { isEmailSuppressed } = await import('@/lib/suppression');
  const emailIsSuppressed = await isEmailSuppressed(customerEmail, companyId);

  if (emailIsSuppressed) {
    console.warn(
      `Email ${customerEmail} is suppressed for company ${companyId} - skipping email`
    );
    return {
      success: false,
      emailSent: false,
      error:
        'Email address is on suppression list (unsubscribed from marketing emails)',
      templateName: template.name,
      recipient: customerEmail,
      subject: template.subject_line,
    };
  }

  // Replace variables in email content
  let htmlContent = template.html_content;
  let textContent = template.text_content;
  let subjectLine = template.subject_line;

  // Log original template content for debugging

  Object.entries(emailVariables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const replacement = String(value || '');

    htmlContent = htmlContent.replace(
      new RegExp(placeholder, 'g'),
      replacement
    );
    textContent = textContent.replace(
      new RegExp(placeholder, 'g'),
      replacement
    );
    subjectLine = subjectLine.replace(
      new RegExp(placeholder, 'g'),
      replacement
    );
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
        to: customerEmail,
        subject: subjectLine,
        html: htmlContent,
        text: textContent,
        companyId,
        templateId: template.id,
        leadId,
        customerId,
        executionId,
        campaignId,
        recipientName: emailVariables.customerName || customerEmail,
        scheduledFor: new Date().toISOString(),
        source: 'automation_workflow',
      }),
    });

    // Check email API response

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Email API error response:', errorData);
      throw new Error(
        `Email sending failed: ${emailResponse.status} - ${errorData}`
      );
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
      recipient: customerEmail,
      subject: subjectLine,
      emailId: emailResult.messageId,
      provider: emailResult.provider,
      sentAt: emailResult.sentAt,
    };
  } catch (error) {
    console.error('Error sending automation email:', {
      error: error instanceof Error ? error.message : error,
      recipient: customerEmail,
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
      recipient: customerEmail,
      subject: subjectLine,
    };
  }
}

// Helper function to execute SMS steps
async function executeSMSStep(
  step: any,
  leadData: any,
  companyId: string,
  leadId: string,
  customerId: string,
  attribution: any,
  partialLeadData: any = null,
  executionId: string,
  campaignId?: string,
  workflowId?: string
) {
  try {
    // Get SMS agent ID
    const agentId = step.sms_agent_id;

    if (!agentId) {
      throw new Error('No SMS agent specified in workflow step');
    }

    // Get SMS message
    const smsMessage = step.sms_message;

    if (!smsMessage?.trim()) {
      throw new Error('No SMS message specified in workflow step');
    }

    // Get customer phone number with comprehensive fallback logic (same as email variables)
    let customerPhone =
      leadData.customerPhone ||
      leadData.phone ||
      leadData.customerInfo?.phone ||
      leadData.contactInfo?.phone ||
      partialLeadData?.form_data?.contactInfo?.phone ||
      partialLeadData?.form_data?.phone ||
      null;

    console.log('SMS Step - Phone extraction attempt:', {
      leadDataCustomerPhone: leadData.customerPhone,
      leadDataPhone: leadData.phone,
      leadDataCustomerInfoPhone: leadData.customerInfo?.phone,
      leadDataContactInfoPhone: leadData.contactInfo?.phone,
      partialLeadContactInfoPhone:
        partialLeadData?.form_data?.contactInfo?.phone,
      partialLeadFormDataPhone: partialLeadData?.form_data?.phone,
      finalPhone: customerPhone,
    });

    if (!customerPhone) {
      // Try to get from customer record if we have customerId
      if (customerId) {
        const supabase = createAdminClient();
        const { data: customer } = await supabase
          .from('customers')
          .select('phone')
          .eq('id', customerId)
          .single();

        if (customer?.phone) {
          customerPhone = customer.phone;
          console.log(
            'SMS Step - Phone found in customer record:',
            customerPhone
          );
        }
      }
    }

    if (!customerPhone) {
      console.error('SMS Step - No phone number found. Available data:', {
        leadData: Object.keys(leadData),
        partialLeadData: partialLeadData ? Object.keys(partialLeadData) : null,
        customerId,
      });
      throw new Error('Customer phone number not available for SMS');
    }

    // Check if phone number is suppressed for SMS
    const phoneIsSuppressed = await isPhoneSuppressed(
      customerPhone,
      companyId,
      'sms'
    );
    if (phoneIsSuppressed) {
      console.warn(
        `Phone ${customerPhone} is suppressed for SMS for company ${companyId} - skipping SMS`
      );
      return {
        success: false,
        smsSent: false,
        error: 'Phone number is on suppression list (unsubscribed from SMS)',
        phone: customerPhone,
      };
    }

    // Import email variables to use for SMS personalization
    const { createSampleVariables, replaceVariablesWithSample } = await import(
      '@/lib/email/variables'
    );

    // Get full lead data with customer and service address details
    const supabase = createAdminClient();

    // Get company slug (needed for campaign URL generation)
    const { data: company } = await supabase
      .from('companies')
      .select('slug')
      .eq('id', companyId)
      .single();
    const companySlug = company?.slug || '';

    // Get the lead's most recent sent/accepted/draft quote (if any)
    let quoteFullUrl = '';
    if (leadId) {
      const { data: quote } = await supabase
        .from('quotes')
        .select('quote_url, quote_token')
        .eq('lead_id', leadId)
        .in('quote_status', ['sent', 'accepted', 'draft'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (quote?.quote_url && quote?.quote_token) {
        const { getFullQuoteUrl } = await import('@/lib/quote-utils');
        const basePath = getFullQuoteUrl(quote.quote_url);
        const separator = quote.quote_url.includes('?') ? '&' : '?';
        quoteFullUrl = `${basePath}${separator}token=${quote.quote_token}`;
      }
    }

    // Get campaign data if campaignId is present
    let campaign: any = null;
    if (campaignId) {
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('id, campaign_id, name')
        .eq('id', campaignId)
        .single();
      campaign = campaignData;
    }

    const { data: fullLeadData } = await supabase
      .from('leads')
      .select(
        `
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
        service_address:service_addresses(
          id,
          street_address,
          city,
          state,
          zip_code,
          apartment_unit,
          address_line_2,
          address_type
        ),
        service_plans:selected_plan_id (
          plan_name,
          plan_description,
          plan_category,
          initial_price,
          initial_discount,
          recurring_price,
          billing_frequency,
          plan_features,
          plan_faqs,
          plan_image_url,
          highlight_badge,
          treatment_frequency,
          plan_disclaimer
        )
      `
      )
      .eq('id', leadId)
      .single();

    // Create email variables for personalization (reuse email variable system)
    const planData = fullLeadData?.service_plans;

    // Format price helper
    const formatPrice = (price: any) => {
      if (!price && price !== 0) return '';
      const numPrice = typeof price === 'string' ? parseFloat(price) : price;
      return isNaN(numPrice) ? '' : numPrice.toString();
    };

    // Debug logging for SMS variable construction
    console.log('SMS Step - Data sources for variables:', {
      fullLeadDataCustomer: fullLeadData?.customer,
      leadDataKeys: Object.keys(leadData),
      leadDataName: leadData.customerName || leadData.name,
      leadDataFirstName: leadData.firstName || leadData.first_name,
      leadDataLastName: leadData.lastName || leadData.last_name,
      partialLeadDataContactInfo: partialLeadData?.form_data?.contactInfo,
    });

    // Create comprehensive email variables object for SMS personalization
    const emailVariables = {
      // Customer details with enhanced fallbacks for partial leads
      customerName:
        fullLeadData?.customer?.first_name && fullLeadData?.customer?.last_name
          ? `${fullLeadData.customer.first_name} ${fullLeadData.customer.last_name}`
          : leadData.customerName ||
            leadData.name ||
            (leadData.contactInfo?.firstName && leadData.contactInfo?.lastName
              ? `${leadData.contactInfo.firstName} ${leadData.contactInfo.lastName}`
              : '') ||
            (partialLeadData?.form_data?.contactInfo?.firstName &&
            partialLeadData?.form_data?.contactInfo?.lastName
              ? `${partialLeadData.form_data.contactInfo.firstName} ${partialLeadData.form_data.contactInfo.lastName}`
              : '') ||
            'Customer',
      firstName:
        fullLeadData?.customer?.first_name ||
        leadData.firstName ||
        leadData.first_name ||
        leadData.contactInfo?.firstName ||
        partialLeadData?.form_data?.contactInfo?.firstName ||
        '',
      lastName:
        fullLeadData?.customer?.last_name ||
        leadData.lastName ||
        leadData.last_name ||
        leadData.contactInfo?.lastName ||
        partialLeadData?.form_data?.contactInfo?.lastName ||
        '',
      customerEmail:
        fullLeadData?.customer?.email ||
        leadData.customerEmail ||
        leadData.email ||
        leadData.contactInfo?.email ||
        partialLeadData?.form_data?.contactInfo?.email ||
        '',
      customerPhone: customerPhone,

      // Address information
      address:
        fullLeadData?.service_address?.street_address ||
        fullLeadData?.customer?.address ||
        partialLeadData?.form_data?.address ||
        leadData.address ||
        '',
      streetAddress:
        fullLeadData?.service_address?.street_address ||
        fullLeadData?.customer?.address ||
        partialLeadData?.form_data?.address ||
        leadData.address ||
        '',
      city:
        fullLeadData?.service_address?.city ||
        fullLeadData?.customer?.city ||
        partialLeadData?.form_data?.city ||
        leadData.city ||
        '',
      state:
        fullLeadData?.service_address?.state ||
        fullLeadData?.customer?.state ||
        partialLeadData?.form_data?.state ||
        leadData.state ||
        '',
      zipCode:
        fullLeadData?.service_address?.zip_code ||
        fullLeadData?.customer?.zip_code ||
        partialLeadData?.form_data?.zipCode ||
        leadData.zipCode ||
        '',

      // Service details
      pestType: fullLeadData?.pest_type || leadData.pestType || leadData.pest_type || '',
      urgency: leadData.urgency || '',
      leadSource: leadData.leadSource || leadData.lead_source || '',

      // Selected Plan Details
      selectedPlanName:
        planData?.plan_name || leadData.selectedPlan?.plan_name || '',
      selectedPlanInitialPrice: formatPrice(
        planData?.initial_price || leadData.selectedPlan?.initial_price
      ),
      selectedPlanNormalInitialPrice: formatPrice(
        (planData?.initial_price || leadData.selectedPlan?.initial_price || 0) +
          (planData?.initial_discount ||
            leadData.selectedPlan?.initial_discount ||
            0)
      ),
      selectedPlanRecurringPrice: formatPrice(
        planData?.recurring_price || leadData.selectedPlan?.recurring_price
      ),

      // Quote URL — link to the customer's quote page
      quoteUrl: quoteFullUrl,

      // Campaign URL — link to the campaign landing page (if campaign-triggered)
      campaignLandingUrl:
        campaignId && customerId && companySlug
          ? generateCampaignLandingUrl(
              companySlug,
              campaign?.campaign_id || campaignId,
              customerId,
              true
            )
          : '',
      campaignName: campaign?.name || '',
    };

    // Debug logging for SMS variables before replacement
    console.log('SMS Step - Final variables for replacement:', {
      firstName: emailVariables.firstName,
      lastName: emailVariables.lastName,
      customerName: emailVariables.customerName,
      customerEmail: emailVariables.customerEmail,
      originalMessage: smsMessage,
    });

    // Replace variables in SMS message
    const personalizedMessage = replaceVariablesWithSample(
      smsMessage,
      emailVariables as any
    );

    console.log('SMS Step - Message after variable replacement:', {
      original: smsMessage,
      personalized: personalizedMessage,
    });

    // Convert phone number to E.164 format required by SMS API
    const e164Phone = toE164PhoneNumber(customerPhone);
    if (!e164Phone) {
      console.error(
        'SMS Step - Could not convert phone number to E.164 format:',
        customerPhone
      );
      throw new Error(
        `Invalid phone number format: ${customerPhone}. Cannot convert to E.164 format required for SMS.`
      );
    }

    console.log('SMS Step - Phone number conversion:', {
      originalPhone: customerPhone,
      e164Phone: e164Phone,
    });

    // Call SMS service
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/sms/send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: companyId,
          customerNumber: e164Phone, // Use E.164 formatted phone number
          agentId: agentId,
          forceNew: true,
          dynamicVariables: {
            initialMessage: personalizedMessage,
            ...emailVariables, // Include all variables for additional personalization
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `SMS API error: ${response.status} - ${errorData.error || 'Unknown error'}`
      );
    }

    const smsResult = await response.json();

    if (!smsResult.success) {
      throw new Error(
        `SMS sending failed: ${smsResult.error || 'Unknown error'}`
      );
    }

    console.log(`✅ SMS sent successfully via workflow step:`, {
      originalPhone: customerPhone,
      e164Phone: e164Phone,
      agentId,
      message:
        personalizedMessage.substring(0, 100) +
        (personalizedMessage.length > 100 ? '...' : ''),
      conversationId: smsResult.conversationId,
      executionId,
    });

    return {
      success: true,
      stepType: 'send_sms',
      customerPhone,
      agentId,
      message: personalizedMessage,
      conversationId: smsResult.conversationId,
    };
  } catch (error) {
    console.error('Error executing SMS step:', error);

    return {
      success: false,
      stepType: 'send_sms',
      error: error instanceof Error ? error.message : 'Unknown error',
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
async function executeConditionalStep(
  step: any,
  leadData: any,
  attribution: any,
  leadId?: string
) {
  const condition = step.condition || {};

  // Fetch current lead data from DB so the condition reflects live state,
  // not the stale snapshot from the trigger payload.
  let currentLeadData = leadData;
  if (leadId) {
    const supabase = createAdminClient();
    const { data: freshLead } = await supabase
      .from('leads')
      .select('*, customers(*)')
      .eq('id', leadId)
      .single();
    if (freshLead) {
      currentLeadData = { ...leadData, ...freshLead };
    }
  }

  // MULTI-BRANCH MODE
  if (Array.isArray(step.branches) && step.branches.length > 0) {
    const fieldValue = currentLeadData[condition.field] ?? attribution?.[condition.field] ?? null;
    const nonDefault = step.branches.filter((b: any) => !b.isDefault);
    let matchedBranchId: string | null = null;

    // --- Phase 1: fast exact/substring matching (no AI cost) ---
    for (const branch of nonDefault) {
      let matched = false;
      switch (condition.operator) {
        case 'equals':
          matched = String(fieldValue).toLowerCase() === String(branch.value).toLowerCase();
          break;
        case 'not_equals':
          matched = String(fieldValue).toLowerCase() !== String(branch.value).toLowerCase();
          break;
        case 'contains':
          matched = String(fieldValue).toLowerCase().includes(String(branch.value).toLowerCase());
          break;
        default:
          matched = String(fieldValue).toLowerCase() === String(branch.value).toLowerCase();
      }
      if (matched) {
        matchedBranchId = branch.id;
        break;
      }
    }

    // --- Phase 2: Gemini fuzzy fallback (only when no exact match found) ---
    if (matchedBranchId === null && nonDefault.length > 0 && fieldValue !== null && fieldValue !== '') {
      try {
        const gemini = getGeminiClient();
        const branchList = nonDefault
          .map((b: any) => `- ID: "${b.id}", Match value: "${b.value}"`)
          .join('\n');

        const prompt = `You are a workflow routing assistant for a pest control company.

A workflow step needs to route to the correct branch based on a lead's data.

Field being checked: "${condition.field}"
Operator: "${condition.operator}"
Actual value from the lead: "${fieldValue}"

Available branches:
${branchList}

Determine which branch ID (if any) the actual value most closely corresponds to.
Consider: alternate spellings, pluralization, abbreviations, common synonyms, and industry terminology.
Examples: "Bedbugs" matches "Bed Bugs", "Google Organic" matches "organic", "Roaches" matches "Cockroaches".

If the operator is "not_equals", find the branch whose value does NOT match the lead value.
If no branch is a reasonable match, return null.

Respond with JSON only:
{
  "matchedBranchId": "<id string or null>",
  "reasoning": "<one sentence>"
}`;

        const aiResponse = await gemini.generate<{ matchedBranchId: string | null; reasoning: string }>(
          prompt,
          { jsonMode: true, temperature: 0.1, maxOutputTokens: 256 }
        );

        if (aiResponse.success && aiResponse.data?.matchedBranchId) {
          const validId = nonDefault.find((b: any) => b.id === aiResponse.data!.matchedBranchId);
          if (validId) {
            matchedBranchId = aiResponse.data.matchedBranchId;
          }
        }
      } catch {
        // Gemini unavailable — fall through to Default branch (no-op)
      }
    }

    return { success: true, isMultiBranch: true, matchedBranchId, fieldValue };
  }

  // LEGACY MODE
  let conditionMet = true;

  if (condition.field && condition.operator && condition.value) {
    const fieldValue =
      currentLeadData[condition.field] || attribution?.[condition.field];

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
    fieldValue: currentLeadData[condition.field] || attribution?.[condition.field],
  };
}

// Helper function to execute lead status update steps
async function executeUpdateLeadStatusStep(
  step: any,
  leadId: string,
  companyId: string
) {
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

// Helper function to execute make call steps
async function executeMakeCallStep(
  step: any,
  leadData: any,
  companyId: string,
  leadId: string,
  customerId: string,
  executionId: string
) {
  const supabase = createAdminClient();

  // Validate agent_id is provided
  if (!step.agent_id) {
    throw new Error('Agent ID is required for make_call step');
  }

  // Get the agent configuration
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('agent_id', step.agent_id)
    .eq('company_id', companyId)
    .eq('agent_type', 'calling')
    .eq('agent_direction', 'outbound')
    .eq('is_active', true)
    .single();

  if (agentError || !agent) {
    throw new Error(
      `Outbound calling agent not found or inactive: ${step.agent_id}`
    );
  }

  if (!agent.phone_number) {
    throw new Error(`Agent ${agent.agent_name} has no phone number configured`);
  }

  // Get Retell API key from company settings
  const { data: settings } = await supabase
    .from('company_settings')
    .select('setting_value')
    .eq('company_id', companyId)
    .eq('setting_key', 'retell_api_key')
    .single();

  if (!settings?.setting_value) {
    throw new Error('Retell API key not configured for company');
  }

  // Get customer and lead details
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (!customer) {
    throw new Error('Customer not found');
  }

  if (!customer.phone) {
    throw new Error('Customer phone number is required for calls');
  }

  // Check if phone number is suppressed
  const phoneIsSuppressed = await isPhoneSuppressed(
    customer.phone,
    companyId,
    'phone'
  );
  if (phoneIsSuppressed) {
    console.warn(
      `Phone ${customer.phone} is suppressed for company ${companyId} - skipping call`
    );
    return {
      success: false,
      callMade: false,
      error: 'Phone number is on suppression list (unsubscribed from calls)',
      customerId,
      phone: customer.phone,
    };
  }

  // Get company info
  const { data: company } = await supabase
    .from('companies')
    .select('name, website')
    .eq('id', companyId)
    .single();

  // Get lead info
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  // Apply delay if specified
  if (step.delay_minutes && step.delay_minutes > 0) {
    await new Promise(resolve =>
      setTimeout(resolve, step.delay_minutes * 60 * 1000)
    );
  }

  // Format phone number
  const cleanPhone = customer.phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('+')
    ? cleanPhone
    : `+1${cleanPhone}`;

  // Prepare call payload
  const callPayload = {
    from_number: agent.phone_number,
    to_number: formattedPhone,
    agent_id: agent.agent_id,
    retell_llm_dynamic_variables: {
      customer_first_name: customer.first_name || '',
      customer_last_name: customer.last_name || '',
      customer_name:
        `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
      customer_email: customer.email || '',
      customer_comments: lead?.comments || '',
      customer_pest_problem: lead?.pest_type || '',
      customer_urgency: lead?.urgency || '',
      customer_street_address: customer.street_address || '',
      customer_city: customer.city || '',
      customer_state: customer.state || '',
      customer_zip: customer.zip_code || '',
      company_id: String(companyId),
      company_name: company?.name || '',
      company_url:
        (Array.isArray(company?.website)
          ? company.website[0]
          : company?.website) || 'https://example.com',
      is_follow_up: 'false',
      lead_id: String(leadId),
      execution_id: String(executionId),
    },
  };

  // Make the call using Retell API
  const callResponse = await fetch(
    'https://api.retellai.com/v2/create-phone-call',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.setting_value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callPayload),
    }
  );

  if (!callResponse.ok) {
    const errorText = await callResponse.text();
    throw new Error(`Retell API error: ${callResponse.status} - ${errorText}`);
  }

  const callResult = await callResponse.json();

  // Log the call in call_automation_log if table exists
  try {
    await supabase.from('call_automation_log').insert({
      execution_id: executionId,
      company_id: companyId,
      lead_id: leadId,
      call_id: callResult.call_id,
      call_type: 'workflow',
      call_status: callResult.call_status || 'calling',
      attempted_at: new Date().toISOString(),
      retell_variables: callPayload.retell_llm_dynamic_variables,
    });
  } catch (logError) {
    console.error('Failed to log call in call_automation_log:', logError);
    // Don't throw - call was successful even if logging failed
  }

  // Update lead status to in_process
  await supabase
    .from('leads')
    .update({
      lead_status: 'in_process',
      last_contacted_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  return {
    success: true,
    callInitiated: true,
    callId: callResult.call_id,
    callStatus: callResult.call_status,
    agentName: agent.agent_name,
    phoneNumber: formattedPhone,
  };
}
