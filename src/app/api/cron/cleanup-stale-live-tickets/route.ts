import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Vercel Cron Job: Cleanup Stale Live Tickets
 *
 * Runs daily at noon EST (5:00 PM UTC) to find tickets with status 'live'
 * that are older than 15 minutes and update them to status 'new'.
 *
 * This handles edge cases where tickets get stuck in 'live' status due to
 * webhook failures or other issues during call processing.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron job request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting cleanup of stale live tickets...');

    // Create admin client for server-side operations
    const supabase = createServiceRoleClient();

    // Calculate cutoff time (15 minutes ago)
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    // Find tickets that are:
    // 1. Status is 'live'
    // 2. Created more than 15 minutes ago
    // 3. Not archived
    const { data: staleTickets, error: selectError } = await supabase
      .from('tickets')
      .select('id, created_at, status')
      .eq('status', 'live')
      .eq('archived', false)
      .lt('created_at', fifteenMinutesAgo.toISOString());

    if (selectError) {
      console.error('[Cron] Error querying stale tickets:', selectError);
      return NextResponse.json(
        {
          error: 'Database query failed',
          details: selectError.message
        },
        { status: 500 }
      );
    }

    // If no stale tickets found, return early
    if (!staleTickets || staleTickets.length === 0) {
      const duration = Date.now() - startTime;
      console.log('[Cron] No stale live tickets found', { duration });
      return NextResponse.json({
        success: true,
        message: 'No stale live tickets found',
        updatedCount: 0,
        duration
      });
    }

    // Update all stale tickets to 'new' status
    const ticketIds = staleTickets.map(t => t.id);

    const { data: updatedTickets, error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'new',
        updated_at: new Date().toISOString()
      })
      .in('id', ticketIds)
      .select('id, status');

    if (updateError) {
      console.error('[Cron] Error updating stale tickets:', updateError);
      return NextResponse.json(
        {
          error: 'Database update failed',
          details: updateError.message,
          foundCount: staleTickets.length
        },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    const updatedCount = updatedTickets?.length || 0;

    // Log results
    console.log('[Cron] Successfully cleaned up stale live tickets', {
      updatedCount,
      ticketIds,
      duration,
      cutoffTime: fifteenMinutesAgo.toISOString()
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} stale ticket(s) from 'live' to 'new'`,
      updatedCount,
      ticketIds,
      duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Cron] Unexpected error during cleanup:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration
      },
      { status: 500 }
    );
  }
}
