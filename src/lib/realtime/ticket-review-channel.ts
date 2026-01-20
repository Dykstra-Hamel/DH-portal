import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface TicketReviewPayload {
  ticket_id: string;
  reviewed_by?: string; // User ID, undefined means review ended
  reviewed_by_name?: string; // User's display name
  reviewed_by_email?: string; // User's email
  reviewed_by_first_name?: string; // User's first name
  reviewed_by_last_name?: string; // User's last name
  reviewed_by_avatar_url?: string | null; // User's avatar URL
  reviewed_at?: string;
  review_expires_at?: string;
  timestamp: string;
}

// Store channel instance to ensure only one channel for ticket reviews
let ticketReviewChannel: RealtimeChannel | null = null;

/**
 * Gets or creates a Supabase Realtime channel for ticket review status updates
 * Uses broadcast feature for real-time collaboration awareness
 * Returns a singleton channel instance shared across all components
 */
export function createTicketReviewChannel(): RealtimeChannel {
  // Return existing channel if it exists
  if (ticketReviewChannel) {
    return ticketReviewChannel;
  }

  const supabase = createClient();

  // Create a single channel for all ticket review updates
  const channel = supabase.channel('ticket-reviews', {
    config: {
      broadcast: {
        self: true, // Receive own broadcasts for same-page updates
      },
    },
  });

  ticketReviewChannel = channel;

  return channel;
}

/**
 * Broadcasts a ticket review status update to all subscribers
 */
export async function broadcastTicketReviewUpdate(
  channel: RealtimeChannel,
  payload: TicketReviewPayload
): Promise<void> {
  try {
    await channel.send({
      type: 'broadcast',
      event: 'ticket-review-update',
      payload,
    });
  } catch (error) {
    console.error('Error broadcasting ticket review update:', error);
  }
}

/**
 * Subscribes to ticket review status updates on the channel
 */
export function subscribeToTicketReviewUpdates(
  channel: RealtimeChannel,
  callback: (payload: TicketReviewPayload) => void
): void {
  channel
    .on('broadcast', { event: 'ticket-review-update' }, ({ payload }) => {
      callback(payload as TicketReviewPayload);
    })
    .subscribe();
}

/**
 * Removes the ticket review channel subscription
 */
export async function removeTicketReviewChannel(
  channel: RealtimeChannel
): Promise<void> {
  // Keep channel alive for other components
  // The channel will be automatically cleaned up when the page unmounts
}
