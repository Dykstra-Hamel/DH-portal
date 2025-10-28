import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { fetchWeatherData } from '@/lib/ai/pest-pressure/weather-fetcher';

/**
 * Inngest Scheduled Function: Sync Weather Data
 *
 * Runs daily at 3:00 AM EST to prefetch weather data for all service areas.
 * Ensures weather cache is populated for pest pressure predictions.
 */
export const syncWeatherData = inngest.createFunction(
  {
    id: 'sync-weather-data',
    name: 'Sync Weather Data',
    retries: 3,
  },
  // Run daily at 3:00 AM EST (after pest pressure aggregation)
  { cron: 'TZ=America/New_York 0 3 * * *' },
  async ({ step }) => {
    const startTime = Date.now();

    console.log('[Inngest] Starting weather data sync...');

    // Step 1: Get unique locations from pest pressure data points
    const locations = await step.run('get-locations', async () => {
      const supabase = createAdminClient();

      // Get distinct locations with lat/lng from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('pest_pressure_data_points')
        .select('lat, lng, city, state')
        .gte('observed_at', thirtyDaysAgo.toISOString())
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) {
        console.error('[Inngest] Error fetching locations:', error);
        throw new Error(`Failed to fetch locations: ${error.message}`);
      }

      // Deduplicate locations (round to 4 decimal places)
      const uniqueLocations = new Map<string, { lat: number; lng: number; city?: string; state?: string }>();

      data?.forEach((point) => {
        const roundedLat = Math.round(point.lat * 10000) / 10000;
        const roundedLng = Math.round(point.lng * 10000) / 10000;
        const key = `${roundedLat},${roundedLng}`;

        if (!uniqueLocations.has(key)) {
          uniqueLocations.set(key, {
            lat: roundedLat,
            lng: roundedLng,
            city: point.city,
            state: point.state,
          });
        }
      });

      const locationsList = Array.from(uniqueLocations.values());

      console.log(`[Inngest] Found ${locationsList.length} unique locations`);

      return locationsList;
    });

    if (locations.length === 0) {
      return {
        success: true,
        message: 'No locations found requiring weather data',
        locations_synced: 0,
        duration: Date.now() - startTime,
      };
    }

    // Step 2: Fetch weather data for each location
    const weatherResults = await step.run('fetch-weather-data', async () => {
      // Fetch yesterday's weather (most recent complete day)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startDate = yesterday.toISOString().split('T')[0];
      const endDate = startDate; // Same day

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const location of locations) {
        try {
          await fetchWeatherData(
            location.lat,
            location.lng,
            startDate,
            endDate,
            location.city,
            location.state
          );

          successCount++;

          results.push({
            lat: location.lat,
            lng: location.lng,
            success: true,
          });

          // Small delay to respect API rate limits
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error(
            `[Inngest] Error fetching weather for (${location.lat}, ${location.lng}):`,
            error
          );

          errorCount++;

          results.push({
            lat: location.lat,
            lng: location.lng,
            success: false,
            error: error.message,
          });
        }
      }

      console.log(`[Inngest] Weather sync completed: ${successCount} success, ${errorCount} errors`);

      return {
        results,
        successCount,
        errorCount,
      };
    });

    const duration = Date.now() - startTime;

    console.log('[Inngest] Weather data sync completed', {
      locationsProcessed: locations.length,
      locationsSuccessful: weatherResults.successCount,
      locationsFailed: weatherResults.errorCount,
      duration,
    });

    return {
      success: true,
      message: `Synced weather data for ${weatherResults.successCount}/${locations.length} locations`,
      summary: {
        locations_processed: locations.length,
        locations_successful: weatherResults.successCount,
        locations_failed: weatherResults.errorCount,
      },
      duration,
    };
  }
);
