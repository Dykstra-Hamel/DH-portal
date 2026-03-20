import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { simpleSubscriptionHandler } from './channel-helpers';

export interface AutomationExecutionUpdate {
  executionId: string;
  executionStatus: string;
  executionData: any;
}

/**
 * Subscribes to automation_executions updates for a specific lead via
 * postgres_changes. Fires whenever a row matching lead_id is updated,
 * letting the UI react to step progress and workflow completion in real-time.
 *
 * Requires `automation_executions` to be in the supabase_realtime publication.
 *
 * @param leadId - UUID of the lead to watch
 * @param onUpdate - Called with the new execution status and data on each change
 * @returns The Realtime channel (pass to removeAutomationExecutionChannel to clean up)
 */
export function subscribeToAutomationExecutions(
  leadId: string,
  onUpdate: (update: AutomationExecutionUpdate) => void
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel(`lead:${leadId}:automation-executions`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'automation_executions',
        filter: `lead_id=eq.${leadId}`,
      },
      (payload) => {
        onUpdate({
          executionId: payload.new.id,
          executionStatus: payload.new.execution_status,
          executionData: payload.new.execution_data,
        });
      }
    )
    .subscribe((status) => {
      simpleSubscriptionHandler(status, 'automation-executions');
    });
}

export function removeAutomationExecutionChannel(channel: RealtimeChannel): void {
  createClient().removeChannel(channel);
}
