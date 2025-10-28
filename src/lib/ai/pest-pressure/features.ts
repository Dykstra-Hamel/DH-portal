/**
 * Feature Engineering for Pest Pressure ML Models
 *
 * Transforms raw pest pressure data into feature vectors for training:
 * - Temporal features (month, week, day of week, seasonality)
 * - Weather features (temperature, precipitation, humidity averages)
 * - Historical features (lagged values, rolling averages)
 * - Geographic features (location encoding)
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import { fetchWeatherData } from './weather-fetcher';
import type { PestPressureFeatures, PestPressureDataPoint } from './types';

/**
 * Build feature vectors for model training
 * Aggregates data points by day and joins with weather data
 */
export async function buildFeatures(
  companyId: string,
  pestType: string | null, // null = all pests combined
  startDate: string,
  endDate: string,
  location?: { city?: string; state?: string; lat?: number; lng?: number }
): Promise<PestPressureFeatures[]> {
  const supabase = createAdminClient();

  console.log(
    `[Feature Engineering] Building features for company ${companyId}, pest: ${pestType || 'all'}, ${startDate} to ${endDate}`
  );

  // Query pest pressure data points
  let query = supabase
    .from('pest_pressure_data_points')
    .select('*')
    .eq('company_id', companyId)
    .gte('observed_at', startDate)
    .lte('observed_at', endDate);

  if (pestType) {
    query = query.eq('pest_type', pestType);
  }

  if (location?.city) {
    query = query.eq('city', location.city);
  }

  if (location?.state) {
    query = query.eq('state', location.state);
  }

  const { data: dataPoints, error } = await query;

  if (error) {
    console.error('[Feature Engineering] Error fetching data points:', error);
    throw new Error('Failed to fetch pest pressure data');
  }

  if (!dataPoints || dataPoints.length === 0) {
    console.warn('[Feature Engineering] No data points found');
    return [];
  }

  console.log(`[Feature Engineering] Processing ${dataPoints.length} data points`);

  // Group data points by date
  const dailyGroups = groupByDate(dataPoints as PestPressureDataPoint[]);

  // Get representative location for weather data
  const weatherLat = location?.lat || getAverageCoordinate(dataPoints, 'lat');
  const weatherLng = location?.lng || getAverageCoordinate(dataPoints, 'lng');

  // Fetch weather data if we have coordinates
  const weatherMap: Map<string, any> = new Map();
  if (weatherLat && weatherLng) {
    const weatherData = await fetchWeatherData(
      weatherLat,
      weatherLng,
      startDate,
      endDate
    );

    weatherData.forEach((w) => {
      weatherMap.set(w.date, w);
    });
  }

  // Build features for each day
  const features: PestPressureFeatures[] = [];
  const dates = Array.from(dailyGroups.keys()).sort();

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const points = dailyGroups.get(date) || [];

    // Calculate target (pressure value for this day)
    const target = calculateDailyPressure(points);

    // Extract temporal features
    const dateObj = new Date(date);
    const temporal = {
      month: dateObj.getMonth() + 1,
      week_of_year: getWeekOfYear(dateObj),
      day_of_week: dateObj.getDay(),
      is_weekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
    };

    // Extract weather features (7-day and 30-day averages)
    const weather = await extractWeatherFeatures(
      date,
      weatherMap,
      weatherLat,
      weatherLng
    );

    // Extract historical features (lagged values, rolling averages)
    const historical = extractHistoricalFeatures(dates, dailyGroups, i);

    features.push({
      company_id: companyId,
      pest_type: pestType || 'all',
      location: {
        city: location?.city,
        state: location?.state,
        lat: weatherLat,
        lng: weatherLng,
      },
      temporal,
      weather,
      historical,
      target,
    });
  }

  console.log(`[Feature Engineering] Built ${features.length} feature vectors`);

  return features;
}

/**
 * Group data points by date (YYYY-MM-DD)
 */
function groupByDate(
  dataPoints: PestPressureDataPoint[]
): Map<string, PestPressureDataPoint[]> {
  const groups = new Map<string, PestPressureDataPoint[]>();

  dataPoints.forEach((point) => {
    const date = point.observed_at.split('T')[0]; // Extract YYYY-MM-DD
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(point);
  });

  return groups;
}

/**
 * Calculate daily pressure value from data points
 * Pressure = weighted average of urgency levels, scaled to 0-10
 */
function calculateDailyPressure(points: PestPressureDataPoint[]): number {
  if (points.length === 0) return 0;

  // Use urgency_level if available, otherwise default to 5
  const urgencyValues = points.map((p) => p.urgency_level || 5);

  // Weight by confidence_score if available
  const weightedSum = points.reduce((sum, p, i) => {
    const weight = p.confidence_score || 1;
    return sum + urgencyValues[i] * weight;
  }, 0);

  const totalWeight = points.reduce((sum, p) => sum + (p.confidence_score || 1), 0);

  const pressure = totalWeight > 0 ? weightedSum / totalWeight : 5;

  // Also consider pest_mentions_count (more mentions = higher pressure)
  const totalMentions = points.reduce((sum, p) => sum + (p.pest_mentions_count || 1), 0);
  const mentionBoost = Math.min(2, totalMentions * 0.1); // Cap at +2

  return Math.min(10, Math.max(0, pressure + mentionBoost));
}

/**
 * Get average coordinate from data points
 */
function getAverageCoordinate(
  dataPoints: any[],
  coord: 'lat' | 'lng'
): number | undefined {
  const values = dataPoints
    .map((p) => p[coord])
    .filter((v): v is number => v != null);

  if (values.length === 0) return undefined;

  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Extract weather features for a given date
 */
async function extractWeatherFeatures(
  date: string,
  weatherMap: Map<string, any>,
  lat?: number,
  lng?: number
): Promise<{
  temp_avg_7d?: number;
  temp_avg_30d?: number;
  precip_total_7d?: number;
  precip_total_30d?: number;
  humidity_avg_7d?: number;
  humidity_avg_30d?: number;
}> {
  if (!lat || !lng) {
    return {};
  }

  // Calculate 7-day averages
  const date7d = new Date(date);
  date7d.setDate(date7d.getDate() - 7);
  const last7Days = getDateRange(date7d.toISOString().split('T')[0], date);

  const temps7d = last7Days
    .map((d) => weatherMap.get(d)?.temp_avg_f)
    .filter((t): t is number => t != null);
  const precips7d = last7Days
    .map((d) => weatherMap.get(d)?.precipitation_inches)
    .filter((p): p is number => p != null);
  const humidities7d = last7Days
    .map((d) => weatherMap.get(d)?.humidity_avg_percent)
    .filter((h): h is number => h != null);

  // Calculate 30-day averages
  const date30d = new Date(date);
  date30d.setDate(date30d.getDate() - 30);
  const last30Days = getDateRange(date30d.toISOString().split('T')[0], date);

  const temps30d = last30Days
    .map((d) => weatherMap.get(d)?.temp_avg_f)
    .filter((t): t is number => t != null);
  const precips30d = last30Days
    .map((d) => weatherMap.get(d)?.precipitation_inches)
    .filter((p): p is number => p != null);
  const humidities30d = last30Days
    .map((d) => weatherMap.get(d)?.humidity_avg_percent)
    .filter((h): h is number => h != null);

  return {
    temp_avg_7d:
      temps7d.length > 0
        ? temps7d.reduce((sum, t) => sum + t, 0) / temps7d.length
        : undefined,
    temp_avg_30d:
      temps30d.length > 0
        ? temps30d.reduce((sum, t) => sum + t, 0) / temps30d.length
        : undefined,
    precip_total_7d:
      precips7d.length > 0 ? precips7d.reduce((sum, p) => sum + p, 0) : undefined,
    precip_total_30d:
      precips30d.length > 0 ? precips30d.reduce((sum, p) => sum + p, 0) : undefined,
    humidity_avg_7d:
      humidities7d.length > 0
        ? humidities7d.reduce((sum, h) => sum + h, 0) / humidities7d.length
        : undefined,
    humidity_avg_30d:
      humidities30d.length > 0
        ? humidities30d.reduce((sum, h) => sum + h, 0) / humidities30d.length
        : undefined,
  };
}

/**
 * Extract historical features (lagged values, rolling averages)
 */
function extractHistoricalFeatures(
  dates: string[],
  dailyGroups: Map<string, PestPressureDataPoint[]>,
  currentIndex: number
): {
  pressure_7d_ago?: number;
  pressure_30d_ago?: number;
  pressure_365d_ago?: number;
  rolling_avg_7d?: number;
  rolling_avg_30d?: number;
} {
  // Pressure 7 days ago
  const pressure_7d_ago =
    currentIndex >= 7
      ? calculateDailyPressure(dailyGroups.get(dates[currentIndex - 7]) || [])
      : undefined;

  // Pressure 30 days ago
  const pressure_30d_ago =
    currentIndex >= 30
      ? calculateDailyPressure(dailyGroups.get(dates[currentIndex - 30]) || [])
      : undefined;

  // Pressure 365 days ago (year-over-year)
  const pressure_365d_ago =
    currentIndex >= 365
      ? calculateDailyPressure(dailyGroups.get(dates[currentIndex - 365]) || [])
      : undefined;

  // Rolling 7-day average
  const rolling7Start = Math.max(0, currentIndex - 6);
  const rolling7Days = dates.slice(rolling7Start, currentIndex + 1);
  const rolling7Pressures = rolling7Days
    .map((d) => calculateDailyPressure(dailyGroups.get(d) || []))
    .filter((p) => p > 0);

  const rolling_avg_7d =
    rolling7Pressures.length > 0
      ? rolling7Pressures.reduce((sum, p) => sum + p, 0) / rolling7Pressures.length
      : undefined;

  // Rolling 30-day average
  const rolling30Start = Math.max(0, currentIndex - 29);
  const rolling30Days = dates.slice(rolling30Start, currentIndex + 1);
  const rolling30Pressures = rolling30Days
    .map((d) => calculateDailyPressure(dailyGroups.get(d) || []))
    .filter((p) => p > 0);

  const rolling_avg_30d =
    rolling30Pressures.length > 0
      ? rolling30Pressures.reduce((sum, p) => sum + p, 0) / rolling30Pressures.length
      : undefined;

  return {
    pressure_7d_ago,
    pressure_30d_ago,
    pressure_365d_ago,
    rolling_avg_7d,
    rolling_avg_30d,
  };
}

/**
 * Get week of year (1-52)
 */
function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

/**
 * Get array of dates between start and end (inclusive)
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
 * Prepare features for real-time prediction (not training)
 * Fetches recent data and builds a single feature vector for current date
 */
export async function buildCurrentFeatures(
  companyId: string,
  pestType: string | null,
  location?: { city?: string; state?: string; lat?: number; lng?: number }
): Promise<PestPressureFeatures | null> {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 365); // Get last year of data
  const startDateStr = startDate.toISOString().split('T')[0];

  const features = await buildFeatures(
    companyId,
    pestType,
    startDateStr,
    endDate,
    location
  );

  // Return most recent feature vector
  return features.length > 0 ? features[features.length - 1] : null;
}

/**
 * Calculate feature importance (for model explainability)
 * Returns correlation of each feature with target variable
 */
export function calculateFeatureImportance(
  features: PestPressureFeatures[]
): Record<string, number> {
  if (features.length < 10) {
    return {};
  }

  const targets = features.map((f) => f.target);

  return {
    month: pearsonCorrelation(
      features.map((f) => f.temporal.month),
      targets
    ),
    week_of_year: pearsonCorrelation(
      features.map((f) => f.temporal.week_of_year),
      targets
    ),
    is_weekend: pearsonCorrelation(
      features.map((f) => (f.temporal.is_weekend ? 1 : 0)),
      targets
    ),
    temp_avg_7d: pearsonCorrelation(
      features.map((f) => f.weather.temp_avg_7d || 0),
      targets
    ),
    precip_total_7d: pearsonCorrelation(
      features.map((f) => f.weather.precip_total_7d || 0),
      targets
    ),
    humidity_avg_7d: pearsonCorrelation(
      features.map((f) => f.weather.humidity_avg_7d || 0),
      targets
    ),
    rolling_avg_7d: pearsonCorrelation(
      features.map((f) => f.historical.rolling_avg_7d || 0),
      targets
    ),
  };
}

/**
 * Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n < 2) return 0;

  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;

  const numerator = x.reduce((sum, val, i) => sum + (val - xMean) * (y[i] - yMean), 0);
  const xDenom = Math.sqrt(x.reduce((sum, val) => sum + Math.pow(val - xMean, 2), 0));
  const yDenom = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0));

  const denominator = xDenom * yDenom;

  return denominator !== 0 ? numerator / denominator : 0;
}
