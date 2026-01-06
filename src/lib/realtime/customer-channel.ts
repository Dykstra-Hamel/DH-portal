import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface CustomerUpdatePayload {
  customer_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  updated_by?: string;
  timestamp: string;
}

// Store channel instances to ensure only one channel per customer
const channelRegistry = new Map<string, RealtimeChannel>();

/**
 * Gets or creates a Supabase Realtime channel for a specific customer's updates
 * Uses broadcast feature for real-time customer synchronization
 * Returns the same channel instance if it already exists for this customer
 */
export function createCustomerChannel(customerId: string): RealtimeChannel {
  const channelKey = `customer:${customerId}`;

  // Return existing channel if it exists
  if (channelRegistry.has(channelKey)) {
    return channelRegistry.get(channelKey)!;
  }

  const supabase = createClient();

  // Create a channel specific to this customer
  const channel = supabase.channel(channelKey, {
    config: {
      broadcast: {
        self: true, // Receive own broadcasts for same-page updates
      },
    },
  });

  // Store in registry
  channelRegistry.set(channelKey, channel);

  return channel;
}

/**
 * Broadcasts a customer update to all subscribers on the channel
 */
export async function broadcastCustomerUpdate(
  channel: RealtimeChannel,
  payload: CustomerUpdatePayload
): Promise<void> {
  try {
    await channel.send({
      type: 'broadcast',
      event: 'customer-update',
      payload,
    });
  } catch (error) {
    console.error('Error broadcasting customer update:', error);
  }
}

/**
 * Subscribes to customer updates on a channel
 */
export function subscribeToCustomerUpdates(
  channel: RealtimeChannel,
  callback: (payload: CustomerUpdatePayload) => void
): void {
  channel
    .on('broadcast', { event: 'customer-update' }, ({ payload }) => {
      callback(payload as CustomerUpdatePayload);
    })
    .subscribe();
}

/**
 * Removes a customer channel subscription
 * Note: This doesn't actually unsubscribe since multiple components may be using the channel
 * The channel will be cleaned up when the page unmounts
 */
export async function removeCustomerChannel(
  channel: RealtimeChannel
): Promise<void> {
  // Don't actually unsubscribe - keep the channel alive for other components
  // The channel will be automatically cleaned up when the page unmounts
}
