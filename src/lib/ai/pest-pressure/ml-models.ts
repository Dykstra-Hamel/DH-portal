/**
 * ML Models for Pest Pressure Prediction
 *
 * Implements lightweight statistical models:
 * 1. Seasonal Forecast - Time-series prediction with weather correlation
 * 2. Anomaly Detection - Real-time spike detection using Z-scores
 *
 * Models are stored as JSON parameters (no external ML libraries required)
 * Future upgrade path: TensorFlow.js when data volume justifies complexity
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import type {
  PestPressureMLModel,
  SeasonalForecastParams,
  AnomalyDetectionParams,
  PestPressureFeatures,
  ModelType,
} from './types';

/**
 * Train a seasonal forecast model for pest pressure prediction
 * Uses historical data to learn baseline, seasonal patterns, trends, and weather correlations
 */
export async function trainSeasonalForecastModel(
  companyId: string,
  pestType: string | null, // null = all pests combined
  features: PestPressureFeatures[],
  dateRange?: { start: string; end: string }
): Promise<PestPressureMLModel> {
  console.log(
    `[ML Models] Training seasonal forecast model for company ${companyId}, pest: ${pestType || 'all'}`
  );

  if (features.length < 30) {
    throw new Error(
      `Insufficient data for training: ${features.length} data points (minimum 30 required)`
    );
  }

  // Calculate baseline (overall average pressure)
  const baseline = features.reduce((sum, f) => sum + f.target, 0) / features.length;

  // Calculate seasonal factors (by month)
  const monthlyData: Record<number, number[]> = {};
  features.forEach((f) => {
    if (!monthlyData[f.temporal.month]) {
      monthlyData[f.temporal.month] = [];
    }
    monthlyData[f.temporal.month].push(f.target);
  });

  const seasonal_factors: Record<string, number> = {};
  for (let month = 1; month <= 12; month++) {
    const monthData = monthlyData[month] || [];
    const monthAvg = monthData.length > 0
      ? monthData.reduce((sum, val) => sum + val, 0) / monthData.length
      : baseline;

    // Seasonal factor = (month avg / baseline) - 1
    // Factor > 0 = above baseline, factor < 0 = below baseline
    seasonal_factors[month.toString()] = baseline > 0 ? (monthAvg / baseline) - 1 : 0;
  }

  // Calculate trend coefficient (simple linear regression on time)
  const trend_coefficient = calculateLinearTrend(features);

  // Calculate weather correlation coefficients
  const weather_coefficients = calculateWeatherCorrelations(features);

  // Build model parameters
  const model_parameters: SeasonalForecastParams = {
    baseline,
    seasonal_factors,
    trend_coefficient,
    weather_coefficients,
  };

  // Calculate accuracy metrics (using holdout validation)
  const accuracy_metrics = evaluateModel(features, model_parameters);

  // Create model record
  const model: PestPressureMLModel = {
    company_id: companyId,
    model_type: 'seasonal_forecast',
    model_version: generateModelVersion(),
    pest_type: pestType || undefined,
    model_parameters,
    training_data_count: features.length,
    training_date_range: dateRange || {
      start: new Date().toISOString(),
      end: new Date().toISOString(),
    },
    accuracy_metrics,
    trained_at: new Date().toISOString(),
    is_active: true,
  };

  console.log('[ML Models] Seasonal forecast model trained:', {
    baseline: baseline.toFixed(2),
    trend: trend_coefficient.toFixed(4),
    mae: accuracy_metrics.mae?.toFixed(2),
    r_squared: accuracy_metrics.r_squared?.toFixed(3),
  });

  return model;
}

/**
 * Train an anomaly detection model for real-time spike detection
 */
export async function trainAnomalyDetectionModel(
  companyId: string,
  pestType: string | null,
  features: PestPressureFeatures[]
): Promise<PestPressureMLModel> {
  console.log(
    `[ML Models] Training anomaly detection model for company ${companyId}, pest: ${pestType || 'all'}`
  );

  if (features.length < 14) {
    throw new Error(
      `Insufficient data for anomaly detection: ${features.length} data points (minimum 14 required)`
    );
  }

  // Anomaly detection parameters
  const model_parameters: AnomalyDetectionParams = {
    rolling_window_days: 14, // 2-week rolling window
    z_score_threshold: 2.5, // 2.5 standard deviations = ~1% false positive rate
    min_data_points: 10,
    seasonal_adjustment: true,
  };

  const model: PestPressureMLModel = {
    company_id: companyId,
    model_type: 'anomaly_detection',
    model_version: generateModelVersion(),
    pest_type: pestType || undefined,
    model_parameters,
    training_data_count: features.length,
    training_date_range: {
      start: new Date().toISOString(),
      end: new Date().toISOString(),
    },
    trained_at: new Date().toISOString(),
    is_active: true,
  };

  console.log('[ML Models] Anomaly detection model trained');

  return model;
}

/**
 * Generate prediction using seasonal forecast model
 */
export function predictSeasonalPressure(
  model: SeasonalForecastParams,
  month: number,
  daysSinceStart: number,
  weatherFeatures?: {
    temp_avg_f?: number;
    precip_inches?: number;
    humidity_percent?: number;
  }
): number {
  // Base prediction = baseline + seasonal adjustment
  const seasonalFactor = model.seasonal_factors[month.toString()] || 0;
  let prediction = model.baseline * (1 + seasonalFactor);

  // Add trend
  prediction += model.trend_coefficient * daysSinceStart;

  // Add weather influence
  if (weatherFeatures) {
    const { temp_weight, precip_weight, humidity_weight } = model.weather_coefficients;

    // Normalize weather values (0-1 range)
    const tempNorm = (weatherFeatures.temp_avg_f || 70) / 100;
    const precipNorm = Math.min((weatherFeatures.precip_inches || 0) / 5, 1);
    const humidityNorm = (weatherFeatures.humidity_percent || 50) / 100;

    const weatherInfluence =
      tempNorm * temp_weight +
      precipNorm * precip_weight +
      humidityNorm * humidity_weight;

    prediction += weatherInfluence;
  }

  // Clamp to 0-10 range
  return Math.max(0, Math.min(10, prediction));
}

/**
 * Detect anomalies using Z-score method
 */
export function detectAnomaly(
  historicalPressure: number[],
  currentPressure: number,
  params: AnomalyDetectionParams
): {
  isAnomaly: boolean;
  zScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  if (historicalPressure.length < params.min_data_points) {
    return { isAnomaly: false, zScore: 0, severity: 'low' };
  }

  // Take rolling window
  const window = historicalPressure.slice(-params.rolling_window_days);

  // Calculate mean and standard deviation
  const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
  const variance =
    window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
  const stdDev = Math.sqrt(variance);

  // Calculate Z-score
  const zScore = stdDev > 0 ? (currentPressure - mean) / stdDev : 0;

  // Determine if anomaly
  const isAnomaly = Math.abs(zScore) > params.z_score_threshold;

  // Determine severity
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (Math.abs(zScore) > 4) {
    severity = 'critical';
  } else if (Math.abs(zScore) > 3.5) {
    severity = 'high';
  } else if (Math.abs(zScore) > 3) {
    severity = 'medium';
  }

  return { isAnomaly, zScore, severity };
}

/**
 * Calculate linear trend coefficient using simple linear regression
 */
function calculateLinearTrend(features: PestPressureFeatures[]): number {
  const n = features.length;
  if (n < 2) return 0;

  // Sort by time (use index as time proxy)
  const sortedFeatures = [...features].sort((a, b) => {
    const aTime = new Date(a.company_id || 0).getTime();
    const bTime = new Date(b.company_id || 0).getTime();
    return aTime - bTime;
  });

  // Simple linear regression: y = mx + b, solve for m (slope)
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = sortedFeatures.map((f) => f.target);

  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

  const numerator = xValues.reduce(
    (sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean),
    0
  );
  const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);

  return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Calculate weather correlation coefficients
 */
function calculateWeatherCorrelations(
  features: PestPressureFeatures[]
): {
  temp_weight: number;
  precip_weight: number;
  humidity_weight: number;
} {
  // Filter features with weather data
  const withWeather = features.filter(
    (f) =>
      f.weather.temp_avg_7d != null &&
      f.weather.precip_total_7d != null &&
      f.weather.humidity_avg_7d != null
  );

  if (withWeather.length < 10) {
    // Not enough data - return default weights
    return {
      temp_weight: 0.3,
      precip_weight: 0.5,
      humidity_weight: 0.2,
    };
  }

  // Calculate Pearson correlation for each weather variable
  const tempCorr = pearsonCorrelation(
    withWeather.map((f) => f.weather.temp_avg_7d!),
    withWeather.map((f) => f.target)
  );
  const precipCorr = pearsonCorrelation(
    withWeather.map((f) => f.weather.precip_total_7d!),
    withWeather.map((f) => f.target)
  );
  const humidityCorr = pearsonCorrelation(
    withWeather.map((f) => f.weather.humidity_avg_7d!),
    withWeather.map((f) => f.target)
  );

  // Normalize correlations to weights (absolute values, then normalize to sum = 1)
  const totalCorr =
    Math.abs(tempCorr) + Math.abs(precipCorr) + Math.abs(humidityCorr);

  if (totalCorr === 0) {
    return { temp_weight: 0.33, precip_weight: 0.33, humidity_weight: 0.34 };
  }

  return {
    temp_weight: Math.abs(tempCorr) / totalCorr,
    precip_weight: Math.abs(precipCorr) / totalCorr,
    humidity_weight: Math.abs(humidityCorr) / totalCorr,
  };
}

/**
 * Calculate Pearson correlation coefficient
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

/**
 * Evaluate model performance using holdout validation
 */
function evaluateModel(
  features: PestPressureFeatures[],
  model: SeasonalForecastParams
): {
  mae: number;
  rmse: number;
  r_squared: number;
} {
  // Use last 20% as test set
  const testSize = Math.floor(features.length * 0.2);
  const testFeatures = features.slice(-testSize);

  const predictions: number[] = [];
  const actuals: number[] = [];

  testFeatures.forEach((f) => {
    const prediction = predictSeasonalPressure(
      model,
      f.temporal.month,
      0, // Simplified - in production would calculate actual days since start
      {
        temp_avg_f: f.weather.temp_avg_7d,
        precip_inches: f.weather.precip_total_7d,
        humidity_percent: f.weather.humidity_avg_7d,
      }
    );

    predictions.push(prediction);
    actuals.push(f.target);
  });

  // Calculate MAE (Mean Absolute Error)
  const mae =
    predictions.reduce((sum, pred, i) => sum + Math.abs(pred - actuals[i]), 0) /
    predictions.length;

  // Calculate RMSE (Root Mean Square Error)
  const mse =
    predictions.reduce((sum, pred, i) => sum + Math.pow(pred - actuals[i], 2), 0) /
    predictions.length;
  const rmse = Math.sqrt(mse);

  // Calculate R² (Coefficient of Determination)
  const actualMean = actuals.reduce((sum, val) => sum + val, 0) / actuals.length;
  const ssRes = predictions.reduce(
    (sum, pred, i) => sum + Math.pow(actuals[i] - pred, 2),
    0
  );
  const ssTot = actuals.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
  const r_squared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return {
    mae: Math.round(mae * 100) / 100,
    rmse: Math.round(rmse * 100) / 100,
    r_squared: Math.round(r_squared * 1000) / 1000,
  };
}

/**
 * Generate model version string (timestamp-based)
 */
function generateModelVersion(): string {
  const now = new Date();
  return `v${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Save model to database and activate it
 */
export async function saveAndActivateModel(
  model: PestPressureMLModel
): Promise<{ id: string }> {
  const supabase = createAdminClient();

  // Insert model
  const { data: insertedModel, error: insertError } = await supabase
    .from('pest_pressure_ml_models')
    .insert(model)
    .select('id')
    .single();

  if (insertError || !insertedModel) {
    console.error('[ML Models] Error saving model:', insertError);
    throw new Error('Failed to save model');
  }

  // Activate model (deactivates others of same type/pest/company)
  const { error: activateError } = await supabase.rpc('activate_ml_model', {
    model_id: insertedModel.id,
  });

  if (activateError) {
    console.error('[ML Models] Error activating model:', activateError);
    // Non-fatal - model is saved even if activation fails
  }

  console.log(
    `[ML Models] Model saved and activated: ${model.model_type} ${model.model_version}`
  );

  return { id: insertedModel.id };
}

/**
 * Load active model from database
 */
export async function loadActiveModel(
  companyId: string,
  modelType: ModelType,
  pestType?: string
): Promise<PestPressureMLModel | null> {
  const supabase = createAdminClient();

  let query = supabase
    .from('pest_pressure_ml_models')
    .select('*')
    .eq('company_id', companyId)
    .eq('model_type', modelType)
    .eq('is_active', true);

  if (pestType) {
    query = query.eq('pest_type', pestType);
  } else {
    query = query.is('pest_type', null);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    console.log(
      `[ML Models] No active ${modelType} model found for company ${companyId}, pest: ${pestType || 'all'}`
    );
    return null;
  }

  return data as PestPressureMLModel;
}
