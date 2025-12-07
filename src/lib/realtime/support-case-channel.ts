/**
 * Support Case Channel - Supabase Realtime Broadcast Abstraction
 *
 * Purpose: Provides reusable utilities for subscribing to support case updates
 * via Supabase Realtime broadcast (not postgres_changes).
 *
 * Pattern: Consistent with ticket and lead broadcast systems
 *
 * Usage:
 * ```typescript
 * const channel = createSupportCaseChannel(companyId);
 * subscribeToSupportCaseUpdates(channel, (payload) => {
 *   // Handle support case update
 * });
 * // Cleanup: supabase.removeChannel(channel)
 * ```
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { simpleSubscriptionHandler } from './channel-helpers';

/**
 * Payload structure broadcast by database triggers when support cases change
 */
export interface SupportCaseUpdatePayload {
  /** Which table triggered the broadcast (always 'support_cases') */
  table: 'support_cases';
  /** Company ID for filtering */
  company_id: string;
  /** Database operation that triggered the update */
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  /** ID of the record that changed (support_case.id) */
  record_id: string;
  /** ID of the support case (same as record_id) */
  case_id: string;
  /** Support case status for quick filtering */
  status?: string;
  /** Unix timestamp when broadcast was sent */
  timestamp: number;
}

/**
 * Creates a Supabase Realtime channel for receiving support case broadcasts
 *
 * Channel naming convention: company:{companyId}:support_cases
 * This ensures each company has isolated realtime updates
 *
 * @param companyId - UUID of the company to subscribe to
 * @returns Configured Realtime channel (not yet subscribed)
 */
export function createSupportCaseChannel(companyId: string): RealtimeChannel {
  const supabase = createClient();
  const channelName = `company:${companyId}:support_cases`;

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
 * Subscribes to support case updates on a given channel
 *
 * The callback will be invoked whenever a support case is
 * inserted, updated, or deleted in the database.
 *
 * Client should:
 * 1. Verify company_id matches expected company
 * 2. Use status field to filter if needed
 * 3. Fetch full data with JOINs using record_id/case_id
 * 4. Update local state based on action (INSERT/UPDATE/DELETE)
 *
 * @param channel - Channel created by createSupportCaseChannel()
 * @param callback - Function to handle broadcast payloads
 */
export function subscribeToSupportCaseUpdates(
  channel: RealtimeChannel,
  callback: (payload: SupportCaseUpdatePayload) => void | Promise<void>
): void {
  channel
    .on('broadcast', { event: 'support_case_update' }, ({ payload }) => {
      callback(payload as SupportCaseUpdatePayload);
    })
    .subscribe((status) => {
      simpleSubscriptionHandler(status, 'support_cases');
    });
}

/**
 * Unsubscribes and removes a support case channel
 *
 * Should be called in cleanup (e.g., useEffect return function)
 *
 * @param channel - Channel to remove
 */
export function removeSupportCaseChannel(channel: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(channel);
}
