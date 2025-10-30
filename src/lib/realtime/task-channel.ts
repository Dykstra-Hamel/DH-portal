/**
 * Task Channel - Supabase Realtime Broadcast Abstraction
 *
 * Purpose: Provides reusable utilities for subscribing to task updates
 * via Supabase Realtime broadcast (not postgres_changes).
 *
 * Pattern: Consistent with ticket, lead, and support case broadcast systems
 *
 * Usage:
 * ```typescript
 * const channel = createTaskChannel(companyId);
 * subscribeToTaskUpdates(channel, (payload) => {
 *   // Handle task update
 * });
 * // Cleanup: supabase.removeChannel(channel)
 * ```
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

/**
 * Payload structure broadcast by database triggers when tasks change
 */
export interface TaskUpdatePayload {
  /** Which table triggered the broadcast (always 'tasks') */
  table: 'tasks';
  /** Company ID for filtering */
  company_id: string;
  /** Database operation that triggered the update */
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  /** ID of the record that changed (task.id) */
  record_id: string;
  /** ID of the task (same as record_id) */
  task_id: string;
  /** Task status for quick filtering */
  status?: string;
  /** Unix timestamp when broadcast was sent */
  timestamp: number;
}

/**
 * Creates a Supabase Realtime channel for receiving task broadcasts
 *
 * Channel naming convention: company:{companyId}:tasks
 * This ensures each company has isolated realtime updates
 *
 * @param companyId - UUID of the company to subscribe to
 * @returns Configured Realtime channel (not yet subscribed)
 */
export function createTaskChannel(companyId: string): RealtimeChannel {
  const supabase = createClient();
  const channelName = `company:${companyId}:tasks`;

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
 * Subscribes to task updates on a given channel
 *
 * The callback will be invoked whenever a task is
 * inserted, updated, or deleted in the database.
 *
 * Client should:
 * 1. Verify company_id matches expected company
 * 2. Use status field to filter if needed
 * 3. Fetch full data with JOINs using record_id/task_id
 * 4. Update local state based on action (INSERT/UPDATE/DELETE)
 *
 * @param channel - Channel created by createTaskChannel()
 * @param callback - Function to handle broadcast payloads
 */
export function subscribeToTaskUpdates(
  channel: RealtimeChannel,
  callback: (payload: TaskUpdatePayload) => void | Promise<void>
): void {
  channel
    .on('broadcast', { event: 'task_update' }, ({ payload }) => {
      callback(payload as TaskUpdatePayload);
    })
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Task broadcast channel error');
      } else if (status === 'TIMED_OUT') {
        console.error('Task broadcast channel timed out');
      }
    });
}

/**
 * Unsubscribes and removes a task channel
 *
 * Should be called in cleanup (e.g., useEffect return function)
 *
 * @param channel - Channel to remove
 */
export function removeTaskChannel(channel: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(channel);
}
