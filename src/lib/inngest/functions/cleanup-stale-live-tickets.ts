import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * Inngest Scheduled Function: Cleanup Stale Live Tickets
 *
 * Runs daily at noon EST (5:00 PM UTC) to find tickets with status 'live'
 * that are older than 15 minutes and update them to status 'new'.
 *
 * This handles edge cases where tickets get stuck in 'live' status due to
 * webhook failures or other issues during call processing.
 */
export const cleanupStaleLiveTickets = inngest.createFunction(
  {
    id: 'cleanup-stale-live-tickets',
    name: 'Cleanup Stale Live Tickets',
    retries: 3,
  },
  // Run daily at noon EST (12:00 PM Eastern Time)
  { cron: 'TZ=America/New_York 0 12 * * *' },
  async ({ step }) => {
    const startTime = Date.now();

    console.log('[Inngest] Starting cleanup of stale live tickets...');

    // Step 1: Query stale live tickets
    const staleTickets = await step.run('query-stale-tickets', async () => {
      const supabase = createAdminClient();

      // Calculate cutoff time (15 minutes ago)
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      // Find tickets that are:
      // 1. Status is 'live'
      // 2. Created more than 15 minutes ago
      // 3. Not archived
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, created_at, status')
        .eq('status', 'live')
        .eq('archived', false)
        .lt('created_at', fifteenMinutesAgo.toISOString());

      if (error) {
        console.error('[Inngest] Error querying stale tickets:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }

      console.log('[Inngest] Found stale tickets:', {
        count: tickets?.length || 0,
        cutoffTime: fifteenMinutesAgo.toISOString(),
      });

      return {
        tickets: tickets || [],
        cutoffTime: fifteenMinutesAgo.toISOString(),
      };
    });

    // If no stale tickets found, return early
    if (staleTickets.tickets.length === 0) {
      const duration = Date.now() - startTime;
      console.log('[Inngest] No stale live tickets found', { duration });

      return {
        success: true,
        message: 'No stale live tickets found',
        updatedCount: 0,
        duration,
      };
    }

    // Step 2: Update stale tickets to 'new' status
    const updateResult = await step.run('update-stale-tickets', async () => {
      const supabase = createAdminClient();
      const ticketIds = staleTickets.tickets.map(t => t.id);

      const { data: updatedTickets, error } = await supabase
        .from('tickets')
        .update({
          status: 'new',
          updated_at: new Date().toISOString(),
        })
        .in('id', ticketIds)
        .select('id, status');

      if (error) {
        console.error('[Inngest] Error updating stale tickets:', error);
        throw new Error(`Database update failed: ${error.message}`);
      }

      const updatedCount = updatedTickets?.length || 0;

      console.log('[Inngest] Successfully updated stale tickets:', {
        updatedCount,
        ticketIds,
      });

      return {
        updatedCount,
        ticketIds,
        updatedTickets: updatedTickets || [],
      };
    });

    const duration = Date.now() - startTime;

    console.log('[Inngest] Cleanup completed successfully', {
      updatedCount: updateResult.updatedCount,
      ticketIds: updateResult.ticketIds,
      duration,
      cutoffTime: staleTickets.cutoffTime,
    });

    return {
      success: true,
      message: `Updated ${updateResult.updatedCount} stale ticket(s) from 'live' to 'new'`,
      updatedCount: updateResult.updatedCount,
      ticketIds: updateResult.ticketIds,
      cutoffTime: staleTickets.cutoffTime,
      duration,
    };
  }
);
