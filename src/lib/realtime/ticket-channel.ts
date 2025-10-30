/**
 * Ticket Channel - Supabase Realtime Broadcast Abstraction
 *
 * Purpose: Provides reusable utilities for subscribing to ticket and call_record
 * updates via Supabase Realtime broadcast (not postgres_changes).
 *
 * Pattern: Consistent with existing count broadcast system (useRealtimeCounts hook)
 *
 * Usage:
 * ```typescript
 * const channel = createTicketChannel(companyId);
 * subscribeToTicketUpdates(channel, (payload) => {
 *   // Handle ticket/call_record update
 * });
 * // Cleanup: supabase.removeChannel(channel)
 * ```
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

/**
 * Payload structure broadcast by database triggers when tickets or call_records change
 */
export interface TicketUpdatePayload {
  /** Which table triggered the broadcast */
  table: 'tickets' | 'call_records';
  /** Company ID for filtering */
  company_id: string;
  /** Database operation that triggered the update */
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  /** ID of the record that changed (ticket.id or call_record.id) */
  record_id: string;
  /** ID of the parent ticket (always present) */
  ticket_id: string;
  /** Ticket status (only for tickets table) for quick filtering */
  status?: string;
  /** Unix timestamp when broadcast was sent */
  timestamp: number;
}

/**
 * Creates a Supabase Realtime channel for receiving ticket/call_record broadcasts
 *
 * Channel naming convention: company:{companyId}:tickets
 * This ensures each company has isolated realtime updates
 *
 * @param companyId - UUID of the company to subscribe to
 * @returns Configured Realtime channel (not yet subscribed)
 */
export function createTicketChannel(companyId: string): RealtimeChannel {
  const supabase = createClient();
  const channelName = `company:${companyId}:tickets`;

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
 * Subscribes to ticket/call_record updates on a given channel
 *
 * The callback will be invoked whenever a ticket or call_record is
 * inserted, updated, or deleted in the database.
 *
 * Client should:
 * 1. Verify company_id matches expected company
 * 2. Use status field to filter (e.g., only fetch if status='live')
 * 3. Fetch full data with JOINs using record_id/ticket_id
 * 4. Update local state based on action (INSERT/UPDATE/DELETE)
 *
 * @param channel - Channel created by createTicketChannel()
 * @param callback - Function to handle broadcast payloads
 */
export function subscribeToTicketUpdates(
  channel: RealtimeChannel,
  callback: (payload: TicketUpdatePayload) => void | Promise<void>
): void {
  channel
    .on('broadcast', { event: 'ticket_update' }, ({ payload }) => {
      callback(payload as TicketUpdatePayload);
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('[TICKET-CHANNEL] ❌ Channel error!');
      } else if (status === 'TIMED_OUT') {
        console.error('[TICKET-CHANNEL] ⏱️ Channel timed out!');
      }
    });
}

/**
 * Unsubscribes and removes a ticket channel
 *
 * Should be called in cleanup (e.g., useEffect return function)
 *
 * @param channel - Channel to remove
 */
export function removeTicketChannel(channel: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(channel);
}
