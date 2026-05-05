import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface LeadReviewPayload {
  lead_id: string;
  reviewed_by?: string; // user_id, undefined means review ended
  reviewed_by_name?: string;
  reviewed_by_email?: string;
  reviewed_by_first_name?: string;
  reviewed_by_last_name?: string;
  reviewed_by_avatar_url?: string | null;
  reviewed_at?: string;
  review_expires_at?: string;
  timestamp: string;
}

let leadReviewChannel: RealtimeChannel | null = null;

/**
 * Singleton broadcast channel for lead review-lock updates. Parallel to
 * `ticket-review-channel.ts` — mirrors the same shape so both systems can
 * coexist without cross-talk (event names differ).
 */
export function createLeadReviewChannel(): RealtimeChannel {
  if (leadReviewChannel) return leadReviewChannel;

  const supabase = createClient();
  const channel = supabase.channel('lead-reviews', {
    config: {
      broadcast: {
        self: true, // Receive own broadcasts so the same page stays in sync
      },
    },
  });

  leadReviewChannel = channel;
  return channel;
}

export async function broadcastLeadReviewUpdate(
  channel: RealtimeChannel,
  payload: LeadReviewPayload
): Promise<void> {
  try {
    await channel.send({
      type: 'broadcast',
      event: 'lead-review-update',
      payload,
    });
  } catch (error) {
    console.error('Error broadcasting lead review update:', error);
  }
}

export function subscribeToLeadReviewUpdates(
  channel: RealtimeChannel,
  callback: (payload: LeadReviewPayload) => void
): void {
  channel
    .on('broadcast', { event: 'lead-review-update' }, ({ payload }) => {
      callback(payload as LeadReviewPayload);
    })
    .subscribe();
}

/**
 * No-op for parity with the ticket helper. The channel persists for the
 * lifetime of the page so other components can keep listening.
 */
export async function removeLeadReviewChannel(
  _channel: RealtimeChannel
): Promise<void> {
  // intentionally no-op
}
