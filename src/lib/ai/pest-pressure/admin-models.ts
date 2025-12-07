/**
 * Admin Pest Pressure ML Models
 *
 * Cross-company ML models for super admin analytics.
 * Aggregates data across all companies by geographic location.
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import { fetchWeatherData } from './weather-fetcher';
import {
  trainSeasonalForecastModel,
  trainAnomalyDetectionModel,
  predictSeasonalPressure,
  detectAnomaly,
} from './ml-models';
import type {
  PestPressureFeatures,
  PestPressureDataPoint,
  SeasonalForecastParams,
  AnomalyDetectionParams,
} from './types';

export interface AdminGeographicScope {
  scope: 'state' | 'city' | 'region' | 'national';
  state?: string; // For state or city scope
  city?: string; // For city scope
  region?: string; // For region scope (comma-separated state list)
}

export interface AdminPestPressureModel {
  id?: string;
  model_type: 'seasonal_forecast' | 'anomaly_detection';
  geographic_scope: string;
  location_state?: string;
  location_city?: string;
  location_region?: string;
  pest_type?: string;
  model_version: string;
  model_parameters: SeasonalForecastParams | AnomalyDetectionParams;
  training_data_count?: number;
  training_date_range?: {
    start: string;
    end: string;
  };
  training_companies?: string[];
  training_companies_count?: number;
  accuracy_metrics?: {
    mae?: number;
    rmse?: number;
    r_squared?: number;
  };
  trained_at?: string;
  is_active?: boolean;
}

/**
 * Build feature vectors from cross-company data for a geographic scope
 */
export async function buildAdminFeatures(
  geographicScope: AdminGeographicScope,
  pestType: string | null,
  startDate: string,
  endDate: string
): Promise<PestPressureFeatures[]> {
  const supabase = createAdminClient();

  console.log(
    `[Admin Feature Engineering] Building features for ${geographicScope.scope}, pest: ${pestType || 'all'}, ${startDate} to ${endDate}`
  );

  // Query pest pressure data points across ALL companies
  let query = supabase
    .from('pest_pressure_data_points')
    .select('*')
    .gte('observed_at', startDate)
    .lte('observed_at', endDate)
    .not('state', 'is', null); // Require valid state

  // Apply geographic filtering
  if (geographicScope.scope === 'state' && geographicScope.state) {
    query = query.eq('state', geographicScope.state);
  } else if (geographicScope.scope === 'city' && geographicScope.state && geographicScope.city) {
    query = query.eq('state', geographicScope.state).eq('city', geographicScope.city);
  } else if (geographicScope.scope === 'region' && geographicScope.region) {
    // Region is comma-separated state list
    const states = geographicScope.region.split(',');
    query = query.in('state', states);
  }
  // For 'national', no geographic filter

  // Apply pest type filter
  if (pestType) {
    query = query.eq('pest_type', pestType);
  }

  const { data: dataPoints, error } = await query;

  if (error) {
    console.error('[Admin Feature Engineering] Error fetching data points:', error);
    throw new Error('Failed to fetch pest pressure data');
  }

  if (!dataPoints || dataPoints.length === 0) {
    console.warn('[Admin Feature Engineering] No data points found');
    return [];
  }

  console.log(`[Admin Feature Engineering] Processing ${dataPoints.length} data points from ${new Set(dataPoints.map((d: any) => d.company_id)).size} companies`);

  // Group data points by date
  const dailyGroups = groupByDate(dataPoints as PestPressureDataPoint[]);

  // Get representative location for weather data (use average coordinates)
  const weatherLat = getAverageCoordinate(dataPoints, 'lat');
  const weatherLng = getAverageCoordinate(dataPoints, 'lng');

  // Fetch weather data if we have coordinates
  const weatherMap: Map<string, any> = new Map();
  if (weatherLat && weatherLng) {
    const weatherData = await fetchWeatherData(weatherLat, weatherLng, startDate, endDate);
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

    // Extract weather features
    const weather = await extractWeatherFeatures(date, weatherMap, weatherLat, weatherLng);

    // Extract historical features
    const historical = extractHistoricalFeatures(dates, dailyGroups, i);

    features.push({
      company_id: 'admin', // Not tied to specific company
      pest_type: pestType || 'all',
      location: {
        city: geographicScope.city,
        state: geographicScope.state,
        lat: weatherLat,
        lng: weatherLng,
      },
      temporal,
      weather,
      historical,
      target,
    });
  }

  console.log(`[Admin Feature Engineering] Built ${features.length} feature vectors`);

  return features;
}

/**
 * Train cross-company seasonal forecast model
 */
export async function trainAdminSeasonalModel(
  geographicScope: AdminGeographicScope,
  pestType: string | null,
  features: PestPressureFeatures[],
  dateRange: { start: string; end: string }
): Promise<AdminPestPressureModel> {
  console.log(
    `[Admin ML Models] Training seasonal forecast model for ${geographicScope.scope}, pest: ${pestType || 'all'}`
  );

  if (features.length < 14) {
    throw new Error(
      `Insufficient data for training: ${features.length} data points (minimum 14 required)`
    );
  }

  // Use existing seasonal forecast training logic
  const model = await trainSeasonalForecastModel('admin', pestType, features, dateRange);

  // Convert to admin model format
  return {
    model_type: 'seasonal_forecast',
    geographic_scope: geographicScope.scope,
    location_state: geographicScope.state,
    location_city: geographicScope.city,
    location_region: geographicScope.region,
    pest_type: pestType || undefined,
    model_version: model.model_version,
    model_parameters: model.model_parameters,
    training_data_count: model.training_data_count,
    training_date_range: model.training_date_range,
    accuracy_metrics: model.accuracy_metrics,
  };
}

/**
 * Train cross-company anomaly detection model
 */
export async function trainAdminAnomalyModel(
  geographicScope: AdminGeographicScope,
  pestType: string | null,
  features: PestPressureFeatures[]
): Promise<AdminPestPressureModel> {
  console.log(
    `[Admin ML Models] Training anomaly detection model for ${geographicScope.scope}, pest: ${pestType || 'all'}`
  );

  if (features.length < 14) {
    throw new Error(
      `Insufficient data for anomaly detection: ${features.length} data points (minimum 14 required)`
    );
  }

  // Use existing anomaly detection training logic
  const model = await trainAnomalyDetectionModel('admin', pestType, features);

  // Convert to admin model format
  return {
    model_type: 'anomaly_detection',
    geographic_scope: geographicScope.scope,
    location_state: geographicScope.state,
    location_city: geographicScope.city,
    location_region: geographicScope.region,
    pest_type: pestType || undefined,
    model_version: model.model_version,
    model_parameters: model.model_parameters,
    training_data_count: model.training_data_count,
  };
}

/**
 * Save admin model to database
 */
export async function saveAdminModel(
  model: AdminPestPressureModel,
  trainingCompanies: string[]
): Promise<{ id: string }> {
  const supabase = createAdminClient();

  // Deactivate previous models with same scope/pest
  await supabase
    .from('admin_pest_pressure_models')
    .update({ is_active: false })
    .eq('model_type', model.model_type)
    .eq('geographic_scope', model.geographic_scope)
    .eq('pest_type', model.pest_type || 'null');

  // Insert new model
  const { data, error } = await supabase
    .from('admin_pest_pressure_models')
    .insert({
      ...model,
      training_companies: trainingCompanies,
      training_companies_count: trainingCompanies.length,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Admin ML Models] Error saving model:', error);
    throw new Error('Failed to save admin model');
  }

  console.log(`[Admin ML Models] Model saved: ${data.id}`);

  return { id: data.id };
}

/**
 * Load active admin model
 */
export async function loadAdminModel(
  geographicScope: AdminGeographicScope,
  modelType: 'seasonal_forecast' | 'anomaly_detection',
  pestType: string | null
): Promise<AdminPestPressureModel | null> {
  const supabase = createAdminClient();

  let query = supabase
    .from('admin_pest_pressure_models')
    .select('*')
    .eq('model_type', modelType)
    .eq('geographic_scope', geographicScope.scope)
    .eq('is_active', true)
    .order('trained_at', { ascending: false })
    .limit(1);

  // Apply location filters
  if (geographicScope.state) {
    query = query.eq('location_state', geographicScope.state);
  }
  if (geographicScope.city) {
    query = query.eq('location_city', geographicScope.city);
  }
  if (geographicScope.region) {
    query = query.eq('location_region', geographicScope.region);
  }

  // Apply pest type filter
  if (pestType) {
    query = query.eq('pest_type', pestType);
  } else {
    query = query.is('pest_type', null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('[Admin ML Models] Error loading model:', error);
    return null;
  }

  return data;
}

// ============================================================================
// Helper Functions (copied from features.ts for admin context)
// ============================================================================

function groupByDate(
  dataPoints: PestPressureDataPoint[]
): Map<string, PestPressureDataPoint[]> {
  const groups = new Map<string, PestPressureDataPoint[]>();

  dataPoints.forEach((point) => {
    const date = point.observed_at.split('T')[0];
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(point);
  });

  return groups;
}

function calculateDailyPressure(points: PestPressureDataPoint[]): number {
  if (points.length === 0) return 0;

  const urgencyValues = points.map((p) => p.urgency_level || 5);

  const weightedSum = points.reduce((sum, p, i) => {
    const weight = p.confidence_score || 1;
    return sum + urgencyValues[i] * weight;
  }, 0);

  const totalWeight = points.reduce((sum, p) => sum + (p.confidence_score || 1), 0);

  const pressure = totalWeight > 0 ? weightedSum / totalWeight : 5;

  const totalMentions = points.reduce((sum, p) => sum + (p.pest_mentions_count || 1), 0);
  const mentionBoost = Math.min(2, totalMentions * 0.1);

  return Math.min(10, Math.max(0, pressure + mentionBoost));
}

function getAverageCoordinate(
  dataPoints: any[],
  coord: 'lat' | 'lng'
): number | undefined {
  const values = dataPoints.map((p) => p[coord]).filter((v): v is number => v != null);

  if (values.length === 0) return undefined;

  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

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
      temps7d.length > 0 ? temps7d.reduce((sum, t) => sum + t, 0) / temps7d.length : undefined,
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
  const pressure_7d_ago =
    currentIndex >= 7
      ? calculateDailyPressure(dailyGroups.get(dates[currentIndex - 7]) || [])
      : undefined;

  const pressure_30d_ago =
    currentIndex >= 30
      ? calculateDailyPressure(dailyGroups.get(dates[currentIndex - 30]) || [])
      : undefined;

  const pressure_365d_ago =
    currentIndex >= 365
      ? calculateDailyPressure(dailyGroups.get(dates[currentIndex - 365]) || [])
      : undefined;

  const rolling7Start = Math.max(0, currentIndex - 6);
  const rolling7Days = dates.slice(rolling7Start, currentIndex + 1);
  const rolling7Pressures = rolling7Days
    .map((d) => calculateDailyPressure(dailyGroups.get(d) || []))
    .filter((p) => p > 0);

  const rolling_avg_7d =
    rolling7Pressures.length > 0
      ? rolling7Pressures.reduce((sum, p) => sum + p, 0) / rolling7Pressures.length
      : undefined;

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

function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

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
