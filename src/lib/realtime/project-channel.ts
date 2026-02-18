/**
 * Project Channel - Supabase Realtime Broadcast Abstraction
 *
 * Purpose: Provides reusable utilities for subscribing to project updates
 * via Supabase Realtime broadcast (not postgres_changes).
 *
 * Pattern: Consistent with ticket, lead, and task broadcast systems
 *
 * Usage:
 * ```typescript
 * const channel = createAdminProjectChannel();
 * subscribeToProjectUpdates(channel, (payload) => {
 *   // Handle project update
 * });
 * // Cleanup: removeProjectChannel(channel)
 * ```
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { simpleSubscriptionHandler } from './channel-helpers';

/**
 * Payload structure broadcast by database triggers when projects or project_tasks change
 */
export interface ProjectUpdatePayload {
  /** Which table triggered the broadcast */
  table: 'projects' | 'project_tasks';
  /** Company ID for filtering */
  company_id: string;
  /** Database operation that triggered the update */
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  /** ID of the record that changed */
  record_id: string;
  /** ID of the parent project */
  project_id: string;
  /** Project status (only for projects table) */
  status?: string;
  /** Unix timestamp when broadcast was sent */
  timestamp: number;
}

/**
 * Creates a Supabase Realtime channel for receiving project broadcasts on the admin channel
 *
 * Channel name: admin:projects
 * This is used by the admin project management page which shows all projects across companies
 *
 * @returns Configured Realtime channel (not yet subscribed)
 */
export function createAdminProjectChannel(): RealtimeChannel {
  const supabase = createClient();
  const channelName = 'admin:projects';

  return supabase.channel(channelName, {
    config: {
      broadcast: {
        self: true,
        ack: true,
      },
    },
  });
}

/**
 * Creates a Supabase Realtime channel for receiving project broadcasts scoped to a company
 *
 * Channel naming convention: company:{companyId}:projects
 *
 * @param companyId - UUID of the company to subscribe to
 * @returns Configured Realtime channel (not yet subscribed)
 */
export function createCompanyProjectChannel(companyId: string): RealtimeChannel {
  const supabase = createClient();
  const channelName = `company:${companyId}:projects`;

  return supabase.channel(channelName, {
    config: {
      broadcast: {
        self: true,
        ack: true,
      },
    },
  });
}

/**
 * Subscribes to project updates on a given channel
 *
 * The callback will be invoked whenever a project or project_task is
 * inserted, updated, or deleted in the database.
 *
 * @param channel - Channel created by createAdminProjectChannel() or createCompanyProjectChannel()
 * @param callback - Function to handle broadcast payloads
 */
export function subscribeToProjectUpdates(
  channel: RealtimeChannel,
  callback: (payload: ProjectUpdatePayload) => void | Promise<void>
): void {
  channel
    .on('broadcast', { event: 'project_update' }, ({ payload }) => {
      callback(payload as ProjectUpdatePayload);
    })
    .subscribe((status) => {
      simpleSubscriptionHandler(status, 'projects');
    });
}

/**
 * Unsubscribes and removes a project channel
 *
 * Should be called in cleanup (e.g., useEffect return function)
 *
 * @param channel - Channel to remove
 */
export function removeProjectChannel(channel: RealtimeChannel): void {
  const supabase = createClient();
  supabase.removeChannel(channel);
}
