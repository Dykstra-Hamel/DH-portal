import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { generateTasksForAllServices } from '@/lib/monthly-services/generate-tasks';

/**
 * Inngest Scheduled Function: Generate Monthly Service Tasks
 *
 * Runs on the 24th of each month at midnight (approximately 1 week before the new month)
 * to generate tasks for all active monthly services for the upcoming month.
 */
export const generateMonthlyServiceTasks = inngest.createFunction(
  {
    id: 'generate-monthly-service-tasks',
    name: 'Generate Monthly Service Tasks',
    retries: 3,
  },
  // Run on the 24th of each month at midnight
  { cron: '0 0 24 * *' },
  async ({ step }) => {
    const startTime = Date.now();

    console.log('[Inngest] Starting monthly service task generation...');

    // Calculate next month (to generate tasks ahead of time)
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStr = nextMonth.toISOString().slice(0, 7);

    console.log(`[Inngest] Generating tasks for month: ${nextMonthStr}`);

    // Step 1: Generate tasks for all active services
    const result = await step.run('generate-tasks-for-all-services', async () => {
      const supabase = createAdminClient();

      const generationResult = await generateTasksForAllServices(supabase, {
        month: nextMonthStr,
      });

      console.log('[Inngest] Task generation result:', generationResult);

      return generationResult;
    });

    const duration = Date.now() - startTime;

    console.log('[Inngest] Monthly service task generation completed', {
      month: nextMonthStr,
      servicesProcessed: result.servicesProcessed,
      tasksCreated: result.tasksCreated,
      errors: result.errors.length,
      duration,
    });

    return {
      success: result.errors.length === 0,
      message: `Generated ${result.tasksCreated} tasks for ${result.servicesProcessed} services`,
      summary: {
        month: nextMonthStr,
        services_processed: result.servicesProcessed,
        tasks_created: result.tasksCreated,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
      duration,
    };
  }
);
