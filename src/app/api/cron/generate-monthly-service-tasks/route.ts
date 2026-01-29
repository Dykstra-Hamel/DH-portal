import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTasksForAllServices } from '@/lib/monthly-services/generate-tasks';

/**
 * Cron job to generate tasks for all active monthly services
 * Runs on the 1st of each month at midnight
 *
 * Vercel Cron Schedule: "0 0 1 * *"
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request from Vercel
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, verify it matches
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron] Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting monthly service task generation');

    // Create service role client for privileged access
    const supabase = await createClient();

    // Generate tasks for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const result = await generateTasksForAllServices(supabase, {
      month: currentMonth,
    });

    console.log('[Cron] Task generation completed:', result);

    return NextResponse.json({
      success: true,
      month: currentMonth,
      ...result,
    });
  } catch (error) {
    console.error('[Cron] Error in monthly service task generation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
