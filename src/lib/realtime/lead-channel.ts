/**
 * Lead Channel - Supabase Realtime Broadcast Abstraction
 *
 * Purpose: Provides reusable utilities for subscribing to lead updates
 * via Supabase Realtime broadcast (not postgres_changes).
 *
 * Pattern: Consistent with ticket broadcast system (ticket-channel.ts)
 *
 * Usage:
 * ```typescript
 * const channel = createLeadChannel(companyId);
 * subscribeToLeadUpdates(channel, (payload) => {
 *   // Handle lead update
 * });
 * // Cleanup: supabase.removeChannel(channel)
 * ```
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { simpleSubscriptionHandler } from './channel-helpers';

/**
 * Payload structure broadcast by database triggers when leads change
 */
export interface LeadUpdatePayload {
  /** Which table triggered the broadcast (always 'leads') */
  table: 'leads';
  /** Company ID for filtering */
  company_id: string;
  /** Database operation that triggered the update */
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  /** ID of the record that changed (lead.id) */
  record_id: string;
  /** ID of the lead (same as record_id) */
  lead_id: string;
  /** Lead status for quick filtering (new, contacted, quoted, won, lost, unqualified) */
  status?: string;
  /** Unix timestamp when broadcast was sent */
  timestamp: number;
}

/**
 * Creates a Supabase Realtime channel for receiving lead broadcasts
 *
 * Channel naming convention: company:{companyId}:leads
 * This ensures each company has isolated realtime updates
 *
 * @param companyId - UUID of the company to subscribe to
 * @returns Configured Realtime channel (not yet subscribed)
 */
export function createLeadChannel(companyId: string): RealtimeChannel {
  const supabase = createClient();
  const channelName = `company:${companyId}:leads`;

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
 * Subscribes to lead updates on a given channel
 *
 * The callback will be invoked whenever a lead is
 * inserted, updated, or deleted in the database.
 *
 * Client should:
 * 1. Verify company_id matches expected company
 * 2. Use status field to filter if needed
 * 3. Fetch full data with JOINs using record_id/lead_id
 * 4. Update local state based on action (INSERT/UPDATE/DELETE)
 *
 * @param channel - Channel created by createLeadChannel()
 * @param callback - Function to handle broadcast payloads
 */
export function subscribeToLeadUpdates(
  channel: RealtimeChannel,
  callback: (payload: LeadUpdatePayload) => void | Promise<void>
): void {
  channel
    .on('broadcast', { event: 'lead_update' }, ({ payload }) => {
      callback(payload as LeadUpdatePayload);
    })
    .subscribe((status) => {
      simpleSubscriptionHandler(status, 'leads');
    });
}

/**
 * Unsubscribes and removes a lead channel
 *
 * Should be called in cleanup (e.g., useEffect return function)
 *
 * @param channel - Channel to remove
 */
export function removeLeadChannel(channel: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(channel);
}
