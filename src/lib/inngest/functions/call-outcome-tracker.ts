import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { conditionalEngine } from '@/lib/automation/conditional-engine';

interface CallOutcomeEvent {
  name: 'automation/call_completed';
  data: {
    callId: string;
    companyId: string;
    leadId: string;
    executionId: string;
    workflowId: string;
    stepId: string;
    callOutcome: 'successful' | 'failed' | 'no_answer' | 'busy' | 'voicemail';
    callDuration?: number;
    callTranscript?: string;
    callAnalysis?: {
      sentiment: 'positive' | 'negative' | 'neutral';
      appointmentScheduled: boolean;
      followUpRequested: boolean;
      objections: string[];
      leadQuality: 'hot' | 'warm' | 'cold';
    };
    retellCallData?: any;
  };
}

export const callOutcomeTracker = inngest.createFunction(
  { 
    id: "call-outcome-tracker",
    retries: 3
  },
  { event: "automation/call_completed" },
  async ({ event, step }) => {
    const {
      callId,
      companyId,
      leadId,
      executionId,
      workflowId,
      stepId,
      callOutcome,
      callDuration = 0,
      callTranscript = '',
      callAnalysis,
      retellCallData
    } = event.data;

    const supabase = createAdminClient();

    // Update call automation log with outcome
    await step.run('update-call-log', async () => {
      const { error } = await supabase
        .from('call_automation_log')
        .update({
          call_status: callOutcome,
          call_duration: callDuration,
          call_transcript: callTranscript,
          call_analysis: callAnalysis,
          retell_data: retellCallData,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('call_id', callId)
        .eq('company_id', companyId);

      if (error) {
        throw new Error(`Failed to update call log: ${error.message}`);
      }

      return { status: 'call_log_updated' };
    });

    // Update lead based on call outcome
    const leadUpdate = await step.run('update-lead-from-call', async () => {
      const updates: any = {
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update lead status based on call outcome
      switch (callOutcome) {
        case 'successful':
          updates.lead_status = 'contacted';
          if (callAnalysis?.appointmentScheduled) {
            updates.lead_status = 'qualified';
            updates.appointment_scheduled = true;
          }
          break;
        case 'no_answer':
        case 'busy':
          // We'll handle this by incrementing in a separate query
          break;
        case 'voicemail':
          updates.lead_status = 'contacted';
          updates.voicemail_left = true;
          break;
        case 'failed':
          // We'll handle this by incrementing in a separate query
          updates.last_call_failed = true;
          break;
      }

      // Add call notes to lead comments
      let callNotes = `📞 Call ${callOutcome} - ID: ${callId}`;
      if (callDuration > 0) {
        callNotes += ` (${Math.round(callDuration / 60)}m)`;
      }
      if (callAnalysis) {
        callNotes += `\n  - Sentiment: ${callAnalysis.sentiment}`;
        if (callAnalysis.appointmentScheduled) callNotes += '\n  - ✅ Appointment scheduled';
        if (callAnalysis.followUpRequested) callNotes += '\n  - 🔔 Follow-up requested';
        if (callAnalysis.objections.length > 0) {
          callNotes += `\n  - Objections: ${callAnalysis.objections.join(', ')}`;
        }
      }

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('comments')
        .eq('id', leadId)
        .single();

      if (leadError) {
        throw new Error(`Failed to fetch lead for update: ${leadError.message}`);
      }

      updates.comments = `${lead.comments || ''}${lead.comments ? '\n\n' : ''}${callNotes}`.trim();

      // Handle call attempts increment for failed calls
      if (callOutcome === 'no_answer' || callOutcome === 'busy' || callOutcome === 'failed') {
        // Get current call attempts count
        const { data: currentLead, error: fetchError } = await supabase
          .from('leads')
          .select('call_attempts')
          .eq('id', leadId)
          .single();

        if (!fetchError && currentLead) {
          updates.call_attempts = (currentLead.call_attempts || 0) + 1;
        }
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId);

      if (updateError) {
        throw new Error(`Failed to update lead: ${updateError.message}`);
      }

      return { status: 'lead_updated', updates };
    });

    // Check for conditional branches based on call outcome
    const branchResult = await step.run('evaluate-call-outcome-branches', async () => {
      // Get the current workflow execution
      const { data: execution } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (!execution) {
        return { status: 'no_execution_found' };
      }

      // Get lead data for branch evaluation
      const { data: lead } = await supabase
        .from('leads')
        .select(`
          *,
          customers (*)
        `)
        .eq('id', leadId)
        .single();

      if (!lead) {
        return { status: 'no_lead_found' };
      }

      // Create evaluation context
      const context = {
        lead,
        execution,
        previousStepResult: {
          status: callOutcome,
          call_outcome: callOutcome,
          call_successful: callOutcome === 'successful',
          call_duration: callDuration,
          appointment_scheduled: callAnalysis?.appointmentScheduled || false,
          lead_quality: callAnalysis?.leadQuality || 'cold'
        },
        callAnalysis,
        timeContext: {
          currentTime: new Date(),
          businessHoursStart: '9:00',
          businessHoursEnd: '17:00',
          timezone: 'UTC'
        }
      };

      // Evaluate conditional branches for this step
      const branch = await conditionalEngine.evaluateWorkflowBranches(
        workflowId,
        stepId,
        context
      );

      if (branch) {
        // Execute branch steps
        for (const branchStep of branch.branch_steps) {
          await inngest.send({
            name: 'automation/trigger',
            data: {
              workflowId,
              companyId,
              leadId,
              customerId: lead.customer_id,
              triggerType: 'call_outcome',
              triggerData: {
                executionId,
                parentStepId: stepId,
                branchId: branch.id,
                branchName: branch.branch_name,
                callOutcome,
                callAnalysis,
                stepData: branchStep
              }
            }
          });
        }

        return {
          status: 'branch_executed',
          branchId: branch.id,
          branchName: branch.branch_name,
          stepsTriggered: branch.branch_steps.length
        };
      }

      return { status: 'no_branch_matched' };
    });

    // Update automation analytics
    await step.run('update-automation-analytics', async () => {
      const analyticsData = {
        company_id: companyId,
        workflow_id: workflowId,
        event_type: 'call_completed',
        event_data: {
          callOutcome,
          callDuration,
          leadId,
          appointmentScheduled: callAnalysis?.appointmentScheduled || false,
          leadQuality: callAnalysis?.leadQuality,
          branchTriggered: branchResult.status === 'branch_executed'
        },
        recorded_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('automation_analytics')
        .insert(analyticsData);

      if (error) {
        console.error('Failed to update automation analytics:', error);
        // Don't throw here as this is not critical
      }

      return { status: 'analytics_updated' };
    });

    // Schedule follow-up actions based on call outcome
    const followUpActions = await step.run('schedule-follow-up-actions', async () => {
      const actions = [];

      switch (callOutcome) {
        case 'no_answer':
        case 'busy':
          // Schedule retry call in 2 hours
          actions.push({
            type: 'retry_call',
            delay: 2 * 60, // 2 hours in minutes
            data: {
              executionId,
              workflowId,
              companyId,
              leadId,
              stepId: `${stepId}-retry`,
              callType: 'follow_up',
              isFollowUp: true,
              retryReason: callOutcome
            }
          });
          break;

        case 'voicemail':
          // Schedule follow-up email in 30 minutes
          actions.push({
            type: 'follow_up_email',
            delay: 30,
            data: {
              executionId,
              workflowId,
              companyId,
              leadId,
              emailType: 'post_voicemail_follow_up',
              personalizeWith: {
                callAttempted: true,
                voicemailLeft: true
              }
            }
          });
          break;

        case 'successful':
          if (callAnalysis?.followUpRequested) {
            // Schedule follow-up call in 24 hours
            actions.push({
              type: 'follow_up_call',
              delay: 24 * 60, // 24 hours
              data: {
                executionId,
                workflowId,
                companyId,
                leadId,
                stepId: `${stepId}-follow-up`,
                callType: 'follow_up',
                isFollowUp: true,
                previousCallSuccess: true
              }
            });
          }
          break;
      }

      // Execute scheduled actions
      for (const action of actions) {
        if (action.type === 'retry_call' || action.type === 'follow_up_call') {
          await inngest.send({
            name: 'automation/schedule_call',
            data: action.data,
            timestamp: Date.now() + action.delay * 60 * 1000
          });
        } else if (action.type === 'follow_up_email') {
          await inngest.send({
            name: 'automation/trigger',
            data: {
              workflowId,
              companyId,
              leadId,
              triggerType: 'call_outcome',
              triggerData: action.data
            },
            timestamp: Date.now() + action.delay * 60 * 1000
          });
        }
      }

      return {
        status: 'follow_up_scheduled',
        actionsScheduled: actions.length,
        actions: actions.map(a => ({ type: a.type, delay: a.delay }))
      };
    });

    return {
      status: 'call_outcome_processed',
      callOutcome,
      leadUpdate: leadUpdate.updates,
      branchResult,
      followUpActions
    };
  }
);

// Handler for processing Retell webhook call completion events
export const retellCallWebhookHandler = inngest.createFunction(
  {
    id: "retell-call-webhook-handler",
    retries: 2
  },
  { event: "retell/call_ended" },
  async ({ event, step }) => {
    const { call_id, call_status, call_duration, transcript, call_analysis } = event.data;

    const supabase = createAdminClient();

    // Find the call automation log entry
    const callLogData = await step.run('find-call-log', async () => {
      const { data: callLog, error } = await supabase
        .from('call_automation_log')
        .select('*')
        .eq('call_id', call_id)
        .single();

      if (error || !callLog) {
        throw new Error(`Call log not found for call_id: ${call_id}`);
      }

      return callLog;
    });

    // Convert Retell call status to our call outcome format
    const callOutcome = await step.run('map-call-outcome', async () => {
      switch (call_status) {
        case 'completed':
          return call_duration > 10 ? 'successful' : 'no_answer';
        case 'no-answer':
          return 'no_answer';
        case 'busy':
          return 'busy';
        case 'failed':
          return 'failed';
        case 'voicemail':
          return 'voicemail';
        default:
          return 'failed';
      }
    });

    // Trigger call outcome processing
    return await step.invoke('process-call-outcome', {
      function: callOutcomeTracker,
      data: {
        name: 'automation/call_completed' as const,
        data: {
          callId: call_id,
          companyId: callLogData.company_id,
          leadId: callLogData.lead_id,
          executionId: callLogData.execution_id,
          workflowId: callLogData.workflow_id || '',
          stepId: callLogData.step_id || '',
          callOutcome,
          callDuration: call_duration || 0,
          callTranscript: transcript || '',
          callAnalysis: call_analysis,
          retellCallData: event.data
        }
      }
    });
  }
);