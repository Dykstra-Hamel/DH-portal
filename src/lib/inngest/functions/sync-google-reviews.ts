import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { aggregateGoogleReviews } from '@/lib/google-places/aggregate-reviews';

/**
 * Inngest Scheduled Function: Sync Google Reviews
 *
 * Runs daily at 2:00 AM EST to aggregate Google Places review data
 * for all companies with configured listings.
 * Ensures cached review data stays fresh for widgets.
 */
export const syncGoogleReviews = inngest.createFunction(
  {
    id: 'sync-google-reviews',
    name: 'Sync Google Reviews',
    retries: 3,
  },
  // Run daily at 2:00 AM EST
  { cron: 'TZ=America/New_York 0 2 * * *' },
  async ({ step }) => {
    const startTime = Date.now();

    console.log('[Inngest] Starting Google Reviews sync...');

    // Step 1: Get all companies with Google Places listings
    const companies = await step.run('get-companies-with-listings', async () => {
      const supabase = createAdminClient();

      // Get distinct company IDs from google_places_listings
      const { data: listings, error: listingsError } = await supabase
        .from('google_places_listings')
        .select('company_id')
        .not('place_id', 'is', null);

      if (listingsError) {
        console.error('[Inngest] Error fetching listings:', listingsError);
        throw new Error(`Failed to fetch listings: ${listingsError.message}`);
      }

      // Deduplicate company IDs
      const companyIds = [...new Set(listings?.map(l => l.company_id) || [])];

      // Also check for companies with legacy single Place ID
      const { data: legacySettings, error: settingsError } = await supabase
        .from('company_settings')
        .select('company_id')
        .eq('setting_key', 'google_place_id')
        .not('setting_value', 'is', null);

      if (!settingsError && legacySettings) {
        const legacyCompanyIds = legacySettings.map(s => s.company_id);
        legacyCompanyIds.forEach(id => {
          if (!companyIds.includes(id)) {
            companyIds.push(id);
          }
        });
      }

      console.log(`[Inngest] Found ${companyIds.length} companies with Google Places listings`);

      return companyIds;
    });

    if (companies.length === 0) {
      return {
        success: true,
        message: 'No companies with Google Places listings found',
        companies_synced: 0,
        duration: Date.now() - startTime,
      };
    }

    // Step 2: Aggregate reviews for each company
    const results = await step.run('aggregate-reviews', async () => {
      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ companyId: string; error: string }> = [];

      for (const companyId of companies) {
        try {
          const result = await aggregateGoogleReviews(companyId);

          if (result) {
            successCount++;
            console.log(
              `[Inngest] Successfully aggregated reviews for company ${companyId}: ${result.rating} (${result.reviewCount} reviews)`
            );
          } else {
            errorCount++;
            console.warn(`[Inngest] No data returned for company ${companyId}`);
            errors.push({
              companyId,
              error: 'No data returned (possibly no API key or no valid Place IDs)',
            });
          }

          // Small delay to respect API rate limits
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error: any) {
          errorCount++;
          console.error(`[Inngest] Error aggregating reviews for company ${companyId}:`, error);
          errors.push({
            companyId,
            error: error.message,
          });
        }
      }

      return {
        successCount,
        errorCount,
        errors,
      };
    });

    const duration = Date.now() - startTime;

    console.log('[Inngest] Google Reviews sync completed', {
      companiesProcessed: companies.length,
      companiesSuccessful: results.successCount,
      companiesFailed: results.errorCount,
      duration,
    });

    return {
      success: true,
      message: `Synced reviews for ${results.successCount}/${companies.length} companies`,
      summary: {
        companies_processed: companies.length,
        companies_successful: results.successCount,
        companies_failed: results.errorCount,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
      duration,
    };
  }
);
