import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { aggregatePestPressureData } from '@/lib/ai/pest-pressure/data-aggregator';

/**
 * Inngest Scheduled Function: Aggregate Pest Pressure Data
 *
 * Runs daily at 2:00 AM EST to aggregate pest observations from:
 * - Call transcripts (via AI analysis)
 * - Form submissions
 * - Lead records
 *
 * Implements waterfall deduplication logic to prevent double-counting.
 */
export const aggregatePestPressureDataJob = inngest.createFunction(
  {
    id: 'aggregate-pest-pressure-data',
    name: 'Aggregate Pest Pressure Data',
    retries: 3,
  },
  // Run daily at 2:00 AM EST
  { cron: 'TZ=America/New_York 0 2 * * *' },
  async ({ step }) => {
    const startTime = Date.now();

    console.log('[Inngest] Starting pest pressure data aggregation...');

    // Step 1: Get all companies that need data aggregation
    const companies = await step.run('get-companies', async () => {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('companies')
        .select('id, name');

      if (error) {
        console.error('[Inngest] Error fetching companies:', error);
        throw new Error(`Failed to fetch companies: ${error.message}`);
      }

      console.log(`[Inngest] Found ${data?.length || 0} companies`);

      return data || [];
    });

    if (companies.length === 0) {
      return {
        success: true,
        message: 'No active companies found',
        results: [],
        duration: Date.now() - startTime,
      };
    }

    // Step 2: Aggregate data for each company
    const results = await step.run('aggregate-company-data', async () => {
      // Aggregate data from yesterday (full day of data)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const startDate = yesterday.toISOString();

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      const endDate = endOfYesterday.toISOString();

      const companyResults = [];

      for (const company of companies) {
        try {
          console.log(`[Inngest] Aggregating data for company ${company.id} (${company.name})`);

          const result = await aggregatePestPressureData(
            company.id,
            startDate,
            endDate
          );

          companyResults.push({
            company_id: company.id,
            company_name: company.name,
            ...result,
            success: true,
          });

          console.log(
            `[Inngest] Company ${company.id}: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors} errors`
          );
        } catch (error: any) {
          console.error(`[Inngest] Error aggregating data for company ${company.id}:`, error);

          companyResults.push({
            company_id: company.id,
            company_name: company.name,
            inserted: 0,
            skipped: 0,
            errors: 1,
            success: false,
            error: error.message,
          });
        }
      }

      return companyResults;
    });

    const duration = Date.now() - startTime;

    const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
    const successCount = results.filter((r) => r.success).length;

    console.log('[Inngest] Pest pressure data aggregation completed', {
      companiesProcessed: companies.length,
      companiesSuccessful: successCount,
      totalInserted,
      totalSkipped,
      totalErrors,
      duration,
    });

    return {
      success: true,
      message: `Aggregated data for ${successCount}/${companies.length} companies`,
      summary: {
        companies_processed: companies.length,
        companies_successful: successCount,
        total_inserted: totalInserted,
        total_skipped: totalSkipped,
        total_errors: totalErrors,
      },
      results,
      duration,
    };
  }
);
