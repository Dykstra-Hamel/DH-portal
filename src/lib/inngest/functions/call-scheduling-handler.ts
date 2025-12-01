import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { getDefaultAgentConfig } from '@/lib/retell-config';

interface CallSchedulingEvent {
  name: 'automation/schedule_call';
  data: {
    executionId: string;
    workflowId: string;
    companyId: string;
    leadId: string;
    stepId: string;
    callType: 'immediate' | 'scheduled' | 'follow_up' | 'urgent';
    delayMinutes?: number;
    callVariables?: any;
    isFollowUp?: boolean;
  };
}

export const callSchedulingHandler = inngest.createFunction(
  { 
    id: "call-scheduling-handler",
    retries: 3
  },
  { event: "automation/schedule_call" },
  async ({ event, step }) => {
    const {
      executionId,
      workflowId,
      companyId,
      leadId,
      stepId,
      callType,
      delayMinutes = 0,
      callVariables = {},
      isFollowUp = false
    } = event.data;

    const supabase = createAdminClient();

    // Get lead and company information
    const leadData = await step.run('fetch-lead-data', async () => {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select(`
          *,
          customers (
            id, name, email, phone, street_address, city, state, zip_code
          )
        `)
        .eq('id', leadId)
        .single();

      if (leadError || !lead) {
        throw new Error(`Failed to fetch lead data: ${leadError?.message}`);
      }

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name, website')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        throw new Error(`Failed to fetch company data: ${companyError?.message}`);
      }

      return { lead, company };
    });

    // Check business hours if this is a scheduled call
    const shouldScheduleNow = await step.run('check-business-hours', async () => {
      if (callType === 'immediate' || callType === 'urgent') {
        return true;
      }

      // Get company business hours settings
      const { data: settings } = await supabase
        .from('company_settings')
        .select('setting_key, setting_value')
        .eq('company_id', companyId)
        .in('setting_key', [
          'business_hours_start',
          'business_hours_end',
          'automation_business_hours_only'
        ]);

      const settingsMap = settings?.reduce((acc, s) => {
        acc[s.setting_key] = s.setting_value;
        return acc;
      }, {} as Record<string, string>) || {};

      // If business hours only is disabled, call now
      if (settingsMap.automation_business_hours_only === 'false') {
        return true;
      }

      // Check if it's within business hours
      const now = new Date();
      const currentHour = now.getHours();
      const startHour = parseInt(settingsMap.business_hours_start?.split(':')[0] || '9');
      const endHour = parseInt(settingsMap.business_hours_end?.split(':')[0] || '17');

      return currentHour >= startHour && currentHour < endHour;
    });

    // If delayMinutes is set, schedule for later
    if (delayMinutes > 0) {
      const scheduledTime = new Date(Date.now() + delayMinutes * 60 * 1000);
      
      return await step.run('schedule-delayed-call', async () => {
        // Insert call automation log entry as scheduled
        const { data: logEntry, error: logError } = await supabase
          .from('call_automation_log')
          .insert({
            execution_id: executionId,
            company_id: companyId,
            lead_id: leadId,
            call_type: callType,
            scheduled_for: scheduledTime.toISOString(),
            call_status: 'scheduled'
          })
          .select()
          .single();

        if (logError) {
          throw new Error(`Failed to log scheduled call: ${logError.message}`);
        }

        // Schedule the actual call execution
        await inngest.send({
          name: 'automation/execute_scheduled_call',
          data: {
            ...event.data,
            logEntryId: logEntry.id,
            scheduledFor: scheduledTime.toISOString()
          },
          timestamp: scheduledTime.getTime()
        });

        return { 
          status: 'scheduled', 
          scheduledFor: scheduledTime.toISOString(),
          logEntryId: logEntry.id
        };
      });
    }

    // Execute call immediately if no delay and within business hours (or override)
    if (shouldScheduleNow) {
      return await step.run('execute-immediate-call', async () => {
        try {
          // Check if the workflow has a specific agent configured
          let agentConfig;

          const { data: execution } = await supabase
            .from('automation_executions')
            .select(`
              workflow_id,
              automation_workflows (
                agent_id
              )
            `)
            .eq('id', executionId)
            .single();

          // If execution has a workflow with a specific agent, use it
          if (execution?.automation_workflows?.[0]?.agent_id) {
            const workflowAgentId = execution.automation_workflows[0].agent_id;

            // Fetch the workflow-specific agent configuration
            const { data: agent } = await supabase
              .from('agents')
              .select('*')
              .eq('id', workflowAgentId)
              .eq('company_id', companyId)
              .eq('is_active', true)
              .eq('agent_direction', 'outbound')
              .eq('agent_type', 'calling')
              .single();

            if (agent) {
              agentConfig = {
                config: {
                  agentId: agent.id,
                  phoneNumber: agent.phone_number,
                  apiKey: process.env.RETELL_API_KEY || ''
                }
              };
            }
          }

          // Fall back to default agent if no workflow agent or workflow agent not found
          if (!agentConfig) {
            agentConfig = await getDefaultAgentConfig(companyId, 'calling', 'outbound');
          }

          if (agentConfig.error || !agentConfig.config) {
            throw new Error(`Agent configuration error: ${agentConfig.error || 'No outbound calling agent found'}`);
          }

          const { lead, company } = leadData;
          const customer = lead.customers;

          if (!customer?.phone) {
            throw new Error('Customer phone number is required for calls');
          }

          // Create call automation log entry
          const { data: logEntry, error: logError } = await supabase
            .from('call_automation_log')
            .insert({
              execution_id: executionId,
              company_id: companyId,
              lead_id: leadId,
              call_type: callType,
              attempted_at: new Date().toISOString(),
              call_status: 'calling'
            })
            .select()
            .single();

          if (logError) {
            throw new Error(`Failed to create call log: ${logError.message}`);
          }

          // Prepare call data for Retell
          const callPayload = {
            from_number: agentConfig.config.phoneNumber,
            to_number: customer.phone.startsWith('+') 
              ? customer.phone 
              : `+1${customer.phone.replace(/\D/g, '')}`,
            agent_id: agentConfig.config.agentId,
            retell_llm_dynamic_variables: {
              customer_first_name: customer.name?.split(' ')[0] || '',
              customer_last_name: customer.name?.split(' ').slice(1).join(' ') || '',
              customer_name: customer.name || '',
              customer_email: customer.email || lead.email || '',
              customer_comments: lead.comments || '',
              customer_pest_problem: lead.pest_type || '',
              customer_urgency: lead.urgency || '',
              customer_street_address: customer.street_address || '',
              customer_city: customer.city || '',
              customer_state: customer.state || '',
              customer_zip: customer.zip_code || '',
              company_id: companyId,
              company_name: company.name,
              company_url: company.website || '',
              is_follow_up: isFollowUp ? 'true' : 'false',
              lead_id: leadId,
              execution_id: executionId,
              call_type: callType,
              ...callVariables
            }
          };

          // Make the call using Retell API
          const callResponse = await fetch('https://api.retellai.com/v2/create-phone-call', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${agentConfig.config.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(callPayload)
          });

          if (!callResponse.ok) {
            const errorText = await callResponse.text();
            throw new Error(`Retell API error: ${callResponse.status} - ${errorText}`);
          }

          const callResult = await callResponse.json();

          // Update call log with Retell call ID
          await supabase
            .from('call_automation_log')
            .update({
              call_id: callResult.call_id,
              call_status: callResult.call_status || 'calling',
              retell_variables: callPayload.retell_llm_dynamic_variables,
              updated_at: new Date().toISOString()
            })
            .eq('id', logEntry.id);

          // Update lead status to contacted
          await supabase
            .from('leads')
            .update({
              lead_status: 'contacted',
              last_contacted_at: new Date().toISOString(),
              comments: `${lead.comments || ''}\n\n📞 Automated call initiated via workflow - Call ID: ${callResult.call_id}`.trim()
            })
            .eq('id', leadId);

          return {
            status: 'call_initiated',
            callId: callResult.call_id,
            callStatus: callResult.call_status,
            logEntryId: logEntry.id
          };

        } catch (error) {
          // Log the error in call automation log
          await supabase
            .from('call_automation_log')
            .insert({
              execution_id: executionId,
              company_id: companyId,
              lead_id: leadId,
              call_type: callType,
              attempted_at: new Date().toISOString(),
              call_status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            });

          throw error;
        }
      });
    } else {
      // Schedule for next business day if outside business hours
      return await step.run('schedule-for-business-hours', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // 9 AM next day

        // Insert call automation log entry as scheduled
        const { data: logEntry, error: logError } = await supabase
          .from('call_automation_log')
          .insert({
            execution_id: executionId,
            company_id: companyId,
            lead_id: leadId,
            call_type: callType,
            scheduled_for: tomorrow.toISOString(),
            call_status: 'scheduled'
          })
          .select()
          .single();

        if (logError) {
          throw new Error(`Failed to log scheduled call: ${logError.message}`);
        }

        // Schedule for business hours
        await inngest.send({
          name: 'automation/execute_scheduled_call',
          data: {
            ...event.data,
            logEntryId: logEntry.id,
            scheduledFor: tomorrow.toISOString()
          },
          timestamp: tomorrow.getTime()
        });

        return { 
          status: 'scheduled_business_hours', 
          scheduledFor: tomorrow.toISOString(),
          logEntryId: logEntry.id
        };
      });
    }
  }
);

// Handler for executing scheduled calls
export const scheduledCallExecutor = inngest.createFunction(
  { 
    id: "scheduled-call-executor",
    retries: 2
  },
  { event: "automation/execute_scheduled_call" },
  async ({ event, step }) => {
    const {
      executionId,
      workflowId,
      companyId,
      leadId,
      stepId,
      callType,
      callVariables = {},
      isFollowUp = false,
      logEntryId,
      scheduledFor
    } = event.data;

    // Use the same execution logic as immediate calls
    return await step.invoke('execute-call', {
      function: callSchedulingHandler,
      data: {
        name: 'automation/schedule_call' as const,
        data: {
          executionId,
          workflowId,
          companyId,
          leadId,
          stepId,
          callType,
          delayMinutes: 0, // No delay for scheduled execution
          callVariables,
          isFollowUp
        }
      }
    });
  }
);