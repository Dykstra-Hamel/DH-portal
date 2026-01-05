/**
 * Campaign Execution Channel - Supabase Realtime Broadcast Abstraction
 *
 * Purpose: Provides reusable utilities for subscribing to campaign execution updates
 * via Supabase Realtime broadcast (not postgres_changes).
 *
 * Pattern: Consistent with lead and ticket broadcast systems
 *
 * Usage:
 * ```typescript
 * const channel = createCampaignExecutionChannel(campaignId);
 * subscribeToCampaignExecutionUpdates(channel, (payload) => {
 *   // Handle execution update
 * });
 * // Cleanup: supabase.removeChannel(channel)
 * ```
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { simpleSubscriptionHandler } from './channel-helpers';

/**
 * Payload structure broadcast when campaign executions change
 */
export interface CampaignExecutionUpdatePayload {
  /** Which table triggered the broadcast (always 'campaign_executions') */
  table: 'campaign_executions';
  /** Campaign ID for filtering */
  campaign_id: string;
  /** Database operation that triggered the update */
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  /** ID of the record that changed (execution.id) */
  record_id: string;
  /** ID of the execution (same as record_id) */
  execution_id: string;
  /** Execution status for quick filtering (pending, in_progress, completed, failed, cancelled) */
  status?: string;
  /** Current step number for progress tracking */
  current_step?: number;
  /** Unix timestamp when broadcast was sent */
  timestamp: number;
}

/**
 * Creates a Supabase Realtime channel for receiving campaign execution broadcasts
 *
 * Channel naming convention: campaign:{campaignId}:executions
 * This ensures each campaign has isolated realtime updates
 *
 * @param campaignId - UUID of the campaign to subscribe to
 * @returns Configured Realtime channel (not yet subscribed)
 */
export function createCampaignExecutionChannel(campaignId: string): RealtimeChannel {
  const supabase = createClient();
  const channelName = `campaign:${campaignId}:executions`;

  return supabase.channel(channelName, {
    config: {
      broadcast: {
        self: true,  // Receive own broadcasts (useful for same-page updates)
        ack: true,   // Wait for acknowledgment (more reliable)
      },
    },
  });
}

/**
 * Subscribes to campaign execution updates on a given channel
 *
 * The callback will be invoked whenever a campaign execution is
 * inserted, updated, or deleted in the database.
 *
 * Client should:
 * 1. Verify campaign_id matches expected campaign
 * 2. Use status field to filter if needed
 * 3. Fetch full data with JOINs using record_id/execution_id
 * 4. Update local state based on action (INSERT/UPDATE/DELETE)
 *
 * @param channel - Channel created by createCampaignExecutionChannel()
 * @param callback - Function to handle broadcast payloads
 */
export function subscribeToCampaignExecutionUpdates(
  channel: RealtimeChannel,
  callback: (payload: CampaignExecutionUpdatePayload) => void | Promise<void>
): void {
  channel
    .on('broadcast', { event: 'execution_update' }, ({ payload }) => {
      callback(payload as CampaignExecutionUpdatePayload);
    })
    .subscribe((status) => {
      simpleSubscriptionHandler(status, 'campaign-executions');
    });
}

/**
 * Unsubscribes and removes a campaign execution channel
 *
 * Should be called in cleanup (e.g., useEffect return function)
 *
 * @param channel - Channel to remove
 */
export function removeCampaignExecutionChannel(channel: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(channel);
}

/**
 * Broadcasts a campaign execution update to all subscribers
 *
 * This should be called after database mutations (INSERT/UPDATE/DELETE)
 * to notify all subscribers of the change.
 *
 * @param campaignId - UUID of the campaign
 * @param executionId - UUID of the execution that changed
 * @param action - Type of database operation
 * @param additionalData - Optional additional data (status, current_step, etc.)
 */
export async function broadcastCampaignExecutionUpdate(
  campaignId: string,
  executionId: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  additionalData?: Record<string, any>
): Promise<void> {
  const supabase = createClient();
  const channel = supabase.channel(`campaign:${campaignId}:executions`);

  await channel.send({
    type: 'broadcast',
    event: 'execution_update',
    payload: {
      table: 'campaign_executions',
      campaign_id: campaignId,
      action,
      record_id: executionId,
      execution_id: executionId,
      timestamp: Date.now(),
      ...additionalData,
    },
  });

  // Clean up the channel after sending
  supabase.removeChannel(channel);
}
