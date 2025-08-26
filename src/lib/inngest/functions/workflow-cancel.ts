import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';

export const workflowCancellationHandler = inngest.createFunction(
  {
    id: 'workflow-cancellation-handler',
    name: 'Handle Workflow Cancellation',
    retries: 2,
  },
  { event: 'workflow/cancel' },
  async ({ event, step }) => {
    const { 
      executionId, 
      workflowId, 
      companyId, 
      cancelledBy, 
      cancellationReason, 
      timestamp 
    } = event.data;

    console.log(`🚫 PROCESSING CANCELLATION: ${executionId}`);

    // Update cancellation metadata in the database
    await step.run('update-cancellation-metadata', async () => {
      const supabase = createAdminClient();
      
      const { data: execution } = await supabase
        .from('automation_executions')
        .select('execution_data')
        .eq('id', executionId)
        .single();
        
      if (execution) {
        await supabase
          .from('automation_executions')
          .update({
            execution_data: {
              ...execution.execution_data,
              cancellationProcessed: true,
              cancellationProcessedAt: new Date().toISOString(),
              inngestCancellationReceived: true
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', executionId);
          
        console.log(`✅ CANCELLATION METADATA UPDATED: ${executionId}`);
      }
      
      return { processed: true };
    });

    // Log cancellation for analytics/debugging
    await step.run('log-cancellation', async () => {
      const supabase = createAdminClient();
      
      // You could insert into a cancellation_log table here if needed
      console.log(`📊 CANCELLATION LOGGED:`, {
        executionId,
        workflowId,
        companyId,
        cancelledBy,
        cancellationReason,
        timestamp
      });
      
      return { logged: true };
    });

    return {
      success: true,
      executionId,
      message: 'Cancellation processed successfully'
    };
  }
);