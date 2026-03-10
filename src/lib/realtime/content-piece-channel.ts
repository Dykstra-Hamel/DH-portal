/**
 * Content Piece Channel - Supabase Realtime Broadcast Abstraction
 *
 * Purpose: Provides reusable utilities for subscribing to content piece updates
 * via Supabase Realtime broadcast (not postgres_changes).
 *
 * Pattern: Consistent with project, ticket, and task broadcast systems
 *
 * Usage:
 * ```typescript
 * const channel = createAdminContentPieceChannel();
 * subscribeToContentPieceUpdates(channel, (payload) => {
 *   // Handle content piece update
 * });
 * // Cleanup: removeContentPieceChannel(channel)
 * ```
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { simpleSubscriptionHandler } from './channel-helpers';

/**
 * Payload structure broadcast by database triggers when monthly_service_content_pieces change
 */
export interface ContentPieceUpdatePayload {
  table: 'monthly_service_content_pieces';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  monthly_service_id: string;
  timestamp: number;
}

/**
 * Creates a Supabase Realtime channel for receiving content piece broadcasts on the admin channel
 *
 * Channel name: admin:content-pieces
 *
 * @returns Configured Realtime channel (not yet subscribed)
 */
export function createAdminContentPieceChannel(): RealtimeChannel {
  const supabase = createClient();
  return supabase.channel('admin:content-pieces', {
    config: {
      broadcast: {
        self: true,
        ack: true,
      },
    },
  });
}

/**
 * Subscribes to content piece updates on a given channel
 *
 * The callback will be invoked whenever a monthly_service_content_piece is
 * inserted, updated, or deleted in the database.
 *
 * @param channel - Channel created by createAdminContentPieceChannel()
 * @param callback - Function to handle broadcast payloads
 */
export function subscribeToContentPieceUpdates(
  channel: RealtimeChannel,
  callback: (payload: ContentPieceUpdatePayload) => void | Promise<void>
): void {
  channel
    .on('broadcast', { event: 'content_piece_update' }, ({ payload }) => {
      callback(payload as ContentPieceUpdatePayload);
    })
    .subscribe((status) => {
      simpleSubscriptionHandler(status, 'content-pieces');
    });
}

/**
 * Unsubscribes and removes a content piece channel
 *
 * Should be called in cleanup (e.g., useEffect return function)
 *
 * @param channel - Channel to remove
 */
export function removeContentPieceChannel(channel: RealtimeChannel): void {
  createClient().removeChannel(channel);
}
