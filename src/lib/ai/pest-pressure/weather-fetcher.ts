/**
 * Weather Data Fetcher for Pest Pressure System
 *
 * Integrates with Open-Meteo API (free, no API key required)
 * - Fetches historical weather data
 * - Caches data to minimize API calls (10K/day limit)
 * - Converts metric to imperial units (pest control industry standard)
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import type { WeatherData } from './types';

/**
 * Open-Meteo API endpoints
 */
const OPEN_METEO_ARCHIVE_API = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_METEO_FORECAST_API = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetch weather data for a location and date range
 * Automatically caches results to minimize API calls
 */
export async function fetchWeatherData(
  lat: number,
  lng: number,
  startDate: string, // YYYY-MM-DD
  endDate: string, // YYYY-MM-DD
  city?: string,
  state?: string
): Promise<WeatherData[]> {
  const supabase = createAdminClient();

  // Round coordinates to 4 decimal places (~11m precision) for cache grouping
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;

  console.log(
    `[Weather Fetcher] Fetching weather for (${roundedLat}, ${roundedLng}) from ${startDate} to ${endDate}`
  );

  // Check cache first
  const { data: cachedData, error: cacheError } = await supabase
    .from('weather_cache')
    .select('*')
    .eq('lat', roundedLat)
    .eq('lng', roundedLng)
    .gte('date', startDate)
    .lte('date', endDate);

  if (cacheError) {
    console.error('[Weather Fetcher] Error querying cache:', cacheError);
    // Continue to fetch from API even if cache fails
  }

  // Determine which dates are missing from cache
  const cachedDates = new Set(cachedData?.map((d) => d.date) || []);
  const allDates = getDateRange(startDate, endDate);
  const missingDates = allDates.filter((date) => !cachedDates.has(date));

  console.log(
    `[Weather Fetcher] Cache status: ${cachedDates.size} cached, ${missingDates.length} missing`
  );

  // Fetch missing dates from Open-Meteo API
  let fetchedData: WeatherData[] = [];
  if (missingDates.length > 0) {
    try {
      fetchedData = await fetchFromOpenMeteo(
        roundedLat,
        roundedLng,
        missingDates[0],
        missingDates[missingDates.length - 1],
        city,
        state
      );

      // Insert into cache
      if (fetchedData.length > 0) {
        const { error: insertError } = await supabase
          .from('weather_cache')
          .upsert(fetchedData, { onConflict: 'lat,lng,date' });

        if (insertError) {
          console.error('[Weather Fetcher] Error caching data:', insertError);
          // Continue even if cache insert fails
        } else {
          console.log(`[Weather Fetcher] Cached ${fetchedData.length} new weather records`);
        }
      }
    } catch (error) {
      console.error('[Weather Fetcher] Error fetching from Open-Meteo:', error);
      // Return cached data only if API fails
      return cachedData || [];
    }
  }

  // Combine cached and fetched data
  const allData = [...(cachedData || []), ...fetchedData];

  // Sort by date
  allData.sort((a, b) => a.date.localeCompare(b.date));

  return allData;
}

/**
 * Fetch weather data from Open-Meteo API
 */
async function fetchFromOpenMeteo(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string,
  city?: string,
  state?: string
): Promise<WeatherData[]> {
  // Determine if we need historical (archive) or forecast API
  const today = new Date().toISOString().split('T')[0];
  const isHistorical = endDate < today;

  const apiUrl = isHistorical ? OPEN_METEO_ARCHIVE_API : OPEN_METEO_FORECAST_API;

  // Build query parameters
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    start_date: startDate,
    end_date: endDate,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean',
    temperature_unit: 'fahrenheit', // Request imperial units directly
    precipitation_unit: 'inch',
    timezone: 'America/New_York', // Default to EST (adjust based on location if needed)
  });

  const url = `${apiUrl}?${params.toString()}`;

  console.log(`[Weather Fetcher] Calling Open-Meteo API: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Open-Meteo API error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  // Parse response
  const daily = json.daily;
  if (!daily || !daily.time) {
    console.warn('[Weather Fetcher] No daily data returned from API');
    return [];
  }

  const weatherData: WeatherData[] = [];

  for (let i = 0; i < daily.time.length; i++) {
    const date = daily.time[i];
    const tempMax = daily.temperature_2m_max?.[i];
    const tempMin = daily.temperature_2m_min?.[i];
    const precip = daily.precipitation_sum?.[i];
    const humidity = daily.relative_humidity_2m_mean?.[i];

    // Calculate average temperature
    const tempAvg =
      tempMax != null && tempMin != null ? (tempMax + tempMin) / 2 : null;

    weatherData.push({
      lat,
      lng,
      city,
      state,
      date,
      temp_max_f: tempMax,
      temp_min_f: tempMin,
      temp_avg_f: tempAvg,
      precipitation_inches: precip,
      humidity_avg_percent: humidity,
      data_source: 'open-meteo',
      fetched_at: new Date().toISOString(),
    });
  }

  return weatherData;
}

/**
 * Generate array of dates between start and end (inclusive)
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Calculate weather aggregates for a location and time period
 * Useful for feature engineering
 */
export async function calculateWeatherAggregates(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<{
  avg_temp_f: number;
  total_precip_inches: number;
  avg_humidity_percent: number;
  days_with_rain: number;
  temp_variance: number;
}> {
  const weatherData = await fetchWeatherData(lat, lng, startDate, endDate);

  if (weatherData.length === 0) {
    return {
      avg_temp_f: 70,
      total_precip_inches: 0,
      avg_humidity_percent: 50,
      days_with_rain: 0,
      temp_variance: 0,
    };
  }

  const temps = weatherData
    .map((d) => d.temp_avg_f)
    .filter((t): t is number => t != null);
  const precips = weatherData
    .map((d) => d.precipitation_inches)
    .filter((p): p is number => p != null);
  const humidities = weatherData
    .map((d) => d.humidity_avg_percent)
    .filter((h): h is number => h != null);

  const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 70;
  const totalPrecip = precips.reduce((a, b) => a + b, 0);
  const avgHumidity =
    humidities.length > 0
      ? humidities.reduce((a, b) => a + b, 0) / humidities.length
      : 50;
  const daysWithRain = precips.filter((p) => p > 0.01).length;

  // Calculate temperature variance (standard deviation)
  const tempVariance =
    temps.length > 1
      ? Math.sqrt(
          temps.reduce((sum, temp) => sum + Math.pow(temp - avgTemp, 2), 0) /
            temps.length
        )
      : 0;

  return {
    avg_temp_f: Math.round(avgTemp * 10) / 10,
    total_precip_inches: Math.round(totalPrecip * 100) / 100,
    avg_humidity_percent: Math.round(avgHumidity * 10) / 10,
    days_with_rain: daysWithRain,
    temp_variance: Math.round(tempVariance * 10) / 10,
  };
}

/**
 * Get weather data for multiple locations (batch processing)
 * Useful for processing all service areas at once
 */
export async function fetchWeatherDataBatch(
  locations: Array<{
    lat: number;
    lng: number;
    city?: string;
    state?: string;
  }>,
  startDate: string,
  endDate: string
): Promise<Map<string, WeatherData[]>> {
  const results = new Map<string, WeatherData[]>();

  // Process locations sequentially to respect API rate limits
  // Open-Meteo allows 10,000 requests/day (generous for production use)
  for (const location of locations) {
    const key = `${location.lat},${location.lng}`;

    try {
      const data = await fetchWeatherData(
        location.lat,
        location.lng,
        startDate,
        endDate,
        location.city,
        location.state
      );
      results.set(key, data);

      // Small delay to be respectful to API (not strictly required)
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`[Weather Fetcher] Failed to fetch weather for ${key}:`, error);
      results.set(key, []);
    }
  }

  return results;
}

/**
 * Clean up old cached weather data (maintenance function)
 * Call periodically via Inngest or cron
 */
export async function cleanupOldWeatherCache(daysToKeep: number = 1095): Promise<number> {
  const supabase = createAdminClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weather_cache')
    .delete()
    .lt('date', cutoffDateStr)
    .select('id');

  if (error) {
    console.error('[Weather Fetcher] Error cleaning up cache:', error);
    return 0;
  }

  const deletedCount = data?.length || 0;
  console.log(`[Weather Fetcher] Cleaned up ${deletedCount} old weather records`);

  return deletedCount;
}
