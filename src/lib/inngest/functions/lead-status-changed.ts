import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';

export const leadStatusChangedHandler = inngest.createFunction(
  {
    id: 'lead-status-changed-handler',
    name: 'Handle Lead Status Changed',
    retries: 3,
  },
  { event: 'lead/status-changed' },
  async ({ event, step }) => {
    const { leadId, companyId, fromStatus, toStatus, leadData, userId, timestamp } = event.data;
    
    console.log(`Processing lead status change: ${fromStatus} → ${toStatus} for lead ${leadId}`);

    // Step 1: Check for auto-cancellation scenarios
    const cancellationResult = await step.run('check-auto-cancellation', async () => {
      const supabase = createAdminClient();
      
      // Get all workflows with auto-cancellation enabled that match this lead's status change
      const { data: workflows, error: workflowError } = await supabase
        .from('automation_workflows')
        .select('id, name, auto_cancel_on_status, cancel_on_statuses')
        .eq('company_id', companyId)
        .eq('auto_cancel_on_status', true);
      
      if (workflowError || !workflows?.length) {
        return { shouldCancel: false, reason: 'No workflows with auto-cancellation found' };
      }
      
      // Check if any workflow should trigger cancellation for this status
      const workflowsToCancel = workflows.filter(workflow => 
        workflow.cancel_on_statuses?.includes(toStatus.toLowerCase())
      );
      
      if (workflowsToCancel.length === 0) {
        return { shouldCancel: false, reason: 'Status not in any workflow cancellation list' };
      }
      
      // Find all pending/running executions for this lead
      const { data: activeExecutions, error } = await supabase
        .from('automation_executions')
        .select(`
          id,
          workflow_id,
          execution_status,
          current_step,
          execution_data,
          workflow:automation_workflows(
            id,
            name,
            workflow_type
          )
        `)
        .eq('lead_id', leadId)
        .eq('company_id', companyId)
        .in('execution_status', ['pending', 'running']);
      
      if (error || !activeExecutions?.length) {
        return { shouldCancel: false, reason: 'No active executions found' };
      }
      
      // Cancel all active executions for this lead
      const cancellationResults = [];
      
      for (const execution of activeExecutions) {
        try {
          const { error: updateError } = await supabase
            .from('automation_executions')
            .update({
              execution_status: 'cancelled',
              completed_at: new Date().toISOString(),
              current_step: 'auto_cancelled_on_status_change',
              execution_data: {
                ...execution.execution_data,
                cancellationReason: `Auto-cancelled due to lead status change to: ${toStatus}`,
                cancelledBy: 'system',
                cancelledAt: new Date().toISOString(),
                originalFromStatus: fromStatus,
                cancellationTriggerStatus: toStatus,
                autoCancellation: true
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', execution.id);
          
          if (updateError) {
            console.error(`Error cancelling execution ${execution.id}:`, updateError);
            cancellationResults.push({
              executionId: execution.id,
              workflowName: (execution.workflow as any)?.name || 'Unknown',
              success: false,
              error: updateError.message
            });
          } else {
            const workflowName = (execution.workflow as any)?.name || 'Unknown';
            console.log(`Auto-cancelled execution ${execution.id} for workflow "${workflowName}" due to lead status change to ${toStatus}`);
            cancellationResults.push({
              executionId: execution.id,
              workflowName: workflowName,
              success: true
            });
          }
        } catch (err) {
          console.error(`Exception cancelling execution ${execution.id}:`, err);
          cancellationResults.push({
            executionId: execution.id,
            workflowName: (execution.workflow as any)?.name || 'Unknown',
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }
      
      return {
        shouldCancel: true,
        reason: `Lead status changed to terminal status: ${toStatus}`,
        activeExecutions: activeExecutions.length,
        cancellationResults,
        successfulCancellations: cancellationResults.filter(r => r.success).length,
        failedCancellations: cancellationResults.filter(r => !r.success).length
      };
    });

    // Step 2: Find workflows triggered by lead status changes
    const matchingWorkflows = await step.run('find-matching-workflows', async () => {
      const supabase = createAdminClient();
      
      const { data: workflows, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('company_id', companyId)
        .eq('trigger_type', 'lead_status_changed')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching workflows:', error);
        return [];
      }

      // Filter workflows based on status conditions
      return workflows.filter(workflow => {
        const conditions = workflow.trigger_conditions || {};
        
        // Check "to_status" condition (required)
        if (conditions.to_status && conditions.to_status !== toStatus) {
          return false;
        }
        
        // Check "from_status" condition (optional)
        if (conditions.from_status && conditions.from_status !== fromStatus) {
          return false;
        }
        
        return true;
      });
    });

    if (matchingWorkflows.length === 0) {
      console.log(`No matching workflows found for status change ${fromStatus} → ${toStatus}`);
      return { 
        success: true, 
        message: 'No matching workflows',
        statusChange: `${fromStatus} → ${toStatus}`,
        workflowsTriggered: 0
      };
    }

    // Step 2: Create execution records and trigger workflows
    const executionResults = [];
    
    for (const workflow of matchingWorkflows) {
      const executionResult = await step.run(`execute-workflow-${workflow.id}`, async () => {
        const supabase = createAdminClient();
        
        // Create execution record
        const { data: execution, error: executionError } = await supabase
          .from('automation_executions')
          .insert({
            workflow_id: workflow.id,
            company_id: companyId,
            lead_id: leadId,
            trigger_event: 'lead_status_changed',
            trigger_data: {
              fromStatus,
              toStatus,
              leadData,
              userId,
              timestamp,
            },
            execution_status: 'pending',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (executionError) {
          console.error(`Error creating execution for workflow ${workflow.id}:`, executionError);
          return { 
            workflowId: workflow.id, 
            success: false, 
            error: executionError.message 
          };
        }

        // Trigger the automation workflow
        await inngest.send({
          name: 'automation/trigger',
          data: {
            workflowId: workflow.id,
            companyId,
            triggerData: {
              executionId: execution.id,
              leadId,
              leadData: {
                ...leadData,
                customerName: `${leadData.customer?.first_name || ''} ${leadData.customer?.last_name || ''}`.trim(),
                customerEmail: leadData.customer?.email,
                customerPhone: leadData.customer?.phone,
                pestType: leadData.pest_type,
                urgency: leadData.urgency,
                leadSource: leadData.lead_source,
                serviceAddress: leadData.service_address,
                oldStatus: fromStatus,
                newStatus: toStatus,
              },
            },
          },
        });

        return { 
          workflowId: workflow.id, 
          executionId: execution.id,
          workflowName: workflow.name,
          success: true 
        };
      });

      executionResults.push(executionResult);
    }

    const successfulExecutions = executionResults.filter(result => result.success);
    const failedExecutions = executionResults.filter(result => !result.success);

    console.log(`Lead status change processing complete: ${successfulExecutions.length} workflows triggered, ${failedExecutions.length} failed`);

    // Log cancellation summary if any occurred
    if (cancellationResult.shouldCancel && 'successfulCancellations' in cancellationResult) {
      console.log(`Auto-cancellation summary: ${cancellationResult.successfulCancellations} executions cancelled, ${cancellationResult.failedCancellations} failed`);
    }

    return {
      success: true,
      leadId,
      statusChange: `${fromStatus} → ${toStatus}`,
      workflowsTriggered: successfulExecutions.length,
      workflowsFailed: failedExecutions.length,
      executionResults,
      matchingWorkflows: matchingWorkflows.map(w => ({
        id: w.id,
        name: w.name,
        conditions: w.trigger_conditions
      })),
      autoCancellation: cancellationResult.shouldCancel ? {
        reason: cancellationResult.reason,
        executionsCancelled: ('successfulCancellations' in cancellationResult) ? cancellationResult.successfulCancellations : 0,
        cancellationsFailed: ('failedCancellations' in cancellationResult) ? cancellationResult.failedCancellations : 0,
        cancellationResults: ('cancellationResults' in cancellationResult) ? cancellationResult.cancellationResults : []
      } : null
    };
  }
);