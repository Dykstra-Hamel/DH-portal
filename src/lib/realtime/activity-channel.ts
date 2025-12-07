/**
 * Activity Channel - Supabase Realtime Broadcast Abstraction
 *
 * Purpose: Provides reusable utilities for subscribing to activity_log
 * updates via Supabase Realtime broadcast (not postgres_changes).
 *
 * Pattern: Consistent with existing broadcast systems (tickets, leads, support_cases)
 *
 * Usage:
 * ```typescript
 * const channel = createActivityChannel(companyId);
 * subscribeToActivityUpdates(channel, (payload) => {
 *   // Handle activity_log update
 * });
 * // Cleanup: supabase.removeChannel(channel)
 * ```
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { simpleSubscriptionHandler } from './channel-helpers';

/**
 * Payload structure broadcast by database triggers when activity_log changes
 */
export interface ActivityUpdatePayload {
  /** Which table triggered the broadcast (always 'activity_log') */
  table: 'activity_log';
  /** Company ID for filtering */
  company_id: string;
  /** Database operation that triggered the update */
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  /** ID of the activity_log record that changed */
  record_id: string;
  /** Type of entity this activity relates to */
  entity_type: 'lead' | 'ticket' | 'support_case' | 'customer';
  /** ID of the entity this activity relates to */
  entity_id: string;
  /** Type of activity that occurred */
  activity_type: string;
  /** Unix timestamp when broadcast was sent */
  timestamp: number;
}

/**
 * Creates a Supabase Realtime channel for receiving activity_log broadcasts
 *
 * Channel naming convention: company:{companyId}:activity
 * This ensures each company has isolated realtime updates
 *
 * @param companyId - UUID of the company to subscribe to
 * @returns Configured Realtime channel (not yet subscribed)
 */
export function createActivityChannel(companyId: string): RealtimeChannel {
  const supabase = createClient();
  const channelName = `company:${companyId}:activity`;

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
 * Subscribes to activity_log updates on a given channel
 *
 * The callback will be invoked whenever an activity_log record is
 * inserted, updated, or deleted in the database.
 *
 * Client should:
 * 1. Verify company_id matches expected company
 * 2. Use entity_id to filter for specific entities (e.g., current customer)
 * 3. Fetch full data with JOINs using record_id if needed
 * 4. Update local state based on action (INSERT/UPDATE/DELETE)
 *
 * @param channel - Channel created by createActivityChannel()
 * @param callback - Function to handle broadcast payloads
 */
export function subscribeToActivityUpdates(
  channel: RealtimeChannel,
  callback: (payload: ActivityUpdatePayload) => void | Promise<void>
): void {
  channel
    .on('broadcast', { event: 'activity_update' }, ({ payload }) => {
      callback(payload as ActivityUpdatePayload);
    })
    .subscribe((status) => {
      simpleSubscriptionHandler(status, 'activity');
    });
}

/**
 * Unsubscribes and removes an activity channel
 *
 * Should be called in cleanup (e.g., useEffect return function)
 *
 * @param channel - Channel to remove
 */
export function removeActivityChannel(channel: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(channel);
}
