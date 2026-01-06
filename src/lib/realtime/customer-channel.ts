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
 * Removes a customer channel subscription and cleans up the channel
 */
export async function removeCustomerChannel(
  channel: RealtimeChannel
): Promise<void> {
  try {
    // Unsubscribe from the channel
    await channel.unsubscribe();

    // Remove from registry by finding the channel key
    for (const [key, registeredChannel] of channelRegistry.entries()) {
      if (registeredChannel === channel) {
        channelRegistry.delete(key);
        break;
      }
    }
  } catch (error) {
    console.error('Error removing customer channel:', error);
  }
}
