// TypeScript type definitions for pest pressure prediction system

export type SourceType = 'call' | 'form' | 'lead' | 'manual';

export type InfestationSeverity = 'minor' | 'moderate' | 'severe' | 'critical';

export type PredictionWindow = '7d' | '30d' | '90d';

export type Trend = 'increasing' | 'stable' | 'decreasing' | 'spike';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export type ModelType = 'seasonal_forecast' | 'anomaly_detection';

// Data point for historical pest observations
export interface PestPressureDataPoint {
  id?: string;
  company_id: string;
  source_type: SourceType;
  source_id: string;
  pest_type: string;
  pest_mentions_count?: number;
  city?: string;
  state?: string;
  zip_code?: string;
  service_area_name?: string;
  lat?: number;
  lng?: number;
  urgency_level?: number;
  infestation_severity?: InfestationSeverity;
  ai_extracted_context?: Record<string, unknown>;
  confidence_score?: number;
  observed_at: string; // ISO 8601 timestamp
  created_at?: string;
}

// Weather data from Open-Meteo API
export interface WeatherData {
  id?: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  date: string; // YYYY-MM-DD
  temp_max_f?: number;
  temp_min_f?: number;
  temp_avg_f?: number;
  precipitation_inches?: number;
  humidity_avg_percent?: number;
  data_source?: string;
  fetched_at?: string;
}

// AI-generated prediction with anomaly detection
export interface PestPressurePrediction {
  id?: string;
  company_id: string;
  pest_type: string;
  location_city?: string;
  location_state?: string;
  prediction_window: PredictionWindow;
  current_pressure?: number;
  predicted_pressure?: number;
  confidence_score?: number;
  trend?: Trend;
  trend_percentage?: number;
  anomaly_detected?: boolean;
  anomaly_severity?: AnomalySeverity;
  anomaly_description?: string;
  contributing_factors?: string[];
  recommendations?: string[];
  model_version?: string;
  data_points_used?: number;
  weather_influence_score?: number;
  generated_at?: string;
  valid_until: string;
}

// ML model storage with versioning
export interface PestPressureMLModel {
  id?: string;
  company_id?: string;
  model_type: ModelType;
  model_version: string;
  pest_type?: string;
  model_parameters: SeasonalForecastParams | AnomalyDetectionParams;
  training_data_count?: number;
  training_date_range?: {
    start: string;
    end: string;
  };
  accuracy_metrics?: {
    mae?: number;
    rmse?: number;
    r_squared?: number;
  };
  trained_at?: string;
  is_active?: boolean;
}

// Seasonal forecast model parameters
export interface SeasonalForecastParams {
  baseline: number;
  seasonal_factors: Record<string, number>; // month -> factor
  trend_coefficient: number;
  weather_coefficients: {
    temp_weight: number;
    precip_weight: number;
    humidity_weight: number;
  };
}

// Anomaly detection model parameters
export interface AnomalyDetectionParams {
  rolling_window_days: number;
  z_score_threshold: number;
  min_data_points: number;
  seasonal_adjustment: boolean;
}

// AI analysis result from transcript
export interface TranscriptAnalysisResult {
  pest_types: Array<{
    pest_type: string;
    mentions_count: number;
    confidence: number;
  }>;
  urgency_level: number;
  infestation_severity?: InfestationSeverity;
  extracted_context: {
    symptoms?: string[];
    location_in_home?: string[];
    duration?: string;
    customer_concerns?: string[];
  };
  overall_confidence: number;
}

// Source data for waterfall lookup
export interface SourceLookupResult {
  source_type: SourceType;
  source_id: string;
  pest_types: string[];
  location: {
    city?: string;
    state?: string;
    zip_code?: string;
    lat?: number;
    lng?: number;
  };
  observed_at: string;
  raw_data: CallRecordData | FormSubmissionData | LeadData;
}

export interface CallRecordData {
  id: string;
  transcript?: string;
  summary?: string;
  duration?: number;
  created_at: string;
}

export interface FormSubmissionData {
  id: string;
  form_data: Record<string, unknown>;
  created_at: string;
}

export interface LeadData {
  id: string;
  pest_type?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
}

// Feature vector for ML training
export interface PestPressureFeatures {
  company_id: string;
  pest_type: string;
  location: {
    city?: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  temporal: {
    month: number;
    week_of_year: number;
    day_of_week: number;
    is_weekend: boolean;
  };
  weather: {
    temp_avg_7d?: number;
    temp_avg_30d?: number;
    precip_total_7d?: number;
    precip_total_30d?: number;
    humidity_avg_7d?: number;
    humidity_avg_30d?: number;
  };
  historical: {
    pressure_7d_ago?: number;
    pressure_30d_ago?: number;
    pressure_365d_ago?: number;
    rolling_avg_7d?: number;
    rolling_avg_30d?: number;
  };
  target: number; // Actual pressure value
}
