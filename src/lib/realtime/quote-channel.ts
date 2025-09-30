import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Quote } from '@/types/quote';

export interface QuoteUpdatePayload {
  lead_id: string;
  quote: Quote;
  updated_by: string;
  timestamp: string;
}

/**
 * Creates a Supabase Realtime channel for a specific lead's quote updates
 * Uses broadcast feature for real-time quote synchronization
 */
export function createQuoteChannel(leadId: string): RealtimeChannel {
  const supabase = createClient();

  // Create a channel specific to this lead's quote
  const channel = supabase.channel(`quote:${leadId}`, {
    config: {
      broadcast: {
        self: false, // Don't receive own broadcasts
      },
    },
  });

  return channel;
}

/**
 * Broadcasts a quote update to all subscribers on the channel
 */
export async function broadcastQuoteUpdate(
  channel: RealtimeChannel,
  payload: QuoteUpdatePayload
): Promise<void> {
  try {
    await channel.send({
      type: 'broadcast',
      event: 'quote-update',
      payload,
    });
  } catch (error) {
    console.error('Error broadcasting quote update:', error);
  }
}

/**
 * Subscribes to quote updates on a channel
 */
export function subscribeToQuoteUpdates(
  channel: RealtimeChannel,
  callback: (payload: QuoteUpdatePayload) => void
): void {
  channel
    .on('broadcast', { event: 'quote-update' }, ({ payload }) => {
      callback(payload as QuoteUpdatePayload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to quote updates for channel: ${channel.topic}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('Realtime channel error - quote updates may not sync in real-time. This can happen if Realtime is not enabled in Supabase.');
      } else if (status === 'TIMED_OUT') {
        console.warn('Quote channel subscription timed out - quote updates may not sync in real-time.');
      }
    });
}

/**
 * Unsubscribes and removes a quote channel
 */
export async function removeQuoteChannel(channel: RealtimeChannel): Promise<void> {
  try {
    await channel.unsubscribe();
    console.log(`Unsubscribed from channel: ${channel.topic}`);
  } catch (error) {
    console.error('Error removing quote channel:', error);
  }
}