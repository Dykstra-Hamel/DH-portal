-- Admin Pest Pressure System
-- Cross-company pest pressure analytics for super admins

-- ============================================================================
-- Aggregated View for Quick Analytics
-- ============================================================================

CREATE VIEW admin_pest_pressure_aggregated AS
SELECT
  state,
  city,
  pest_type,
  DATE_TRUNC('day', observed_at) as observation_date,
  COUNT(*) as data_points_count,
  AVG(urgency_level) as avg_urgency,
  AVG(CASE WHEN urgency_level IS NOT NULL THEN urgency_level ELSE 5 END) as avg_urgency_filled,
  AVG(lat) as avg_lat,
  AVG(lng) as avg_lng,
  ARRAY_AGG(DISTINCT company_id) as contributing_companies,
  COUNT(DISTINCT company_id) as company_count,
  MIN(observed_at) as first_observation,
  MAX(observed_at) as last_observation
FROM pest_pressure_data_points
WHERE state IS NOT NULL -- Only include records with valid location
GROUP BY state, city, pest_type, DATE_TRUNC('day', observed_at);

COMMENT ON VIEW admin_pest_pressure_aggregated IS 'Aggregated daily pest pressure data across all companies for admin analytics';

-- ============================================================================
-- Admin Models Table
-- ============================================================================

CREATE TABLE admin_pest_pressure_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Model type
  model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('seasonal_forecast', 'anomaly_detection')),

  -- Geographic scope
  geographic_scope VARCHAR(50) NOT NULL CHECK (geographic_scope IN ('state', 'city', 'region', 'national')),
  location_state VARCHAR(2), -- e.g., 'AZ'
  location_city VARCHAR(255), -- e.g., 'Phoenix'
  location_region VARCHAR(100), -- e.g., 'Phoenix Metro', 'Southwest'

  -- Pest information
  pest_type VARCHAR(255), -- NULL means all pests combined

  -- Model data
  model_version VARCHAR(50) NOT NULL,
  model_parameters JSONB NOT NULL,

  -- Training metadata
  training_data_count INT,
  training_date_range JSONB, -- { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }
  training_companies UUID[], -- Array of company IDs that contributed data
  training_companies_count INT,

  -- Accuracy metrics
  accuracy_metrics JSONB, -- { "mae": 0.5, "rmse": 0.7, "r_squared": 0.85 }

  -- Timestamps
  trained_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_admin_pest_models_location_state ON admin_pest_pressure_models(location_state) WHERE location_state IS NOT NULL;
CREATE INDEX idx_admin_pest_models_location_city ON admin_pest_pressure_models(location_city) WHERE location_city IS NOT NULL;
CREATE INDEX idx_admin_pest_models_location_region ON admin_pest_pressure_models(location_region) WHERE location_region IS NOT NULL;
CREATE INDEX idx_admin_pest_models_pest_type ON admin_pest_pressure_models(pest_type) WHERE pest_type IS NOT NULL;
CREATE INDEX idx_admin_pest_models_active ON admin_pest_pressure_models(is_active) WHERE is_active = true;
CREATE INDEX idx_admin_pest_models_scope_type ON admin_pest_pressure_models(geographic_scope, model_type);

COMMENT ON TABLE admin_pest_pressure_models IS 'ML models trained on cross-company pest pressure data for admin analytics';
COMMENT ON COLUMN admin_pest_pressure_models.geographic_scope IS 'Scope of the model: state, city, region, or national';
COMMENT ON COLUMN admin_pest_pressure_models.training_companies IS 'Array of company UUIDs that contributed data to training';

-- ============================================================================
-- Admin Predictions Table
-- ============================================================================

CREATE TABLE admin_pest_pressure_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Link to model
  model_id UUID REFERENCES admin_pest_pressure_models(id) ON DELETE CASCADE,

  -- Geographic scope
  geographic_scope VARCHAR(50) NOT NULL CHECK (geographic_scope IN ('state', 'city', 'region', 'national')),
  location_state VARCHAR(2),
  location_city VARCHAR(255),
  location_region VARCHAR(100),

  -- Pest information
  pest_type VARCHAR(255) NOT NULL,

  -- Prediction data
  prediction_window VARCHAR(10) NOT NULL CHECK (prediction_window IN ('7d', '30d', '90d')),
  current_pressure DECIMAL(4, 2),
  predicted_pressure DECIMAL(4, 2),
  confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),

  -- Trend analysis
  trend VARCHAR(20) CHECK (trend IN ('increasing', 'stable', 'decreasing', 'spike')),
  trend_percentage DECIMAL(5, 2),

  -- Anomaly detection
  anomaly_detected BOOLEAN DEFAULT false,
  anomaly_severity VARCHAR(20) CHECK (anomaly_severity IN ('low', 'medium', 'high', 'critical')),
  anomaly_description TEXT,

  -- AI insights
  contributing_factors TEXT[],
  recommendations TEXT[],

  -- Metadata
  model_version VARCHAR(50),
  data_points_used INT,
  contributing_companies_count INT,
  weather_influence_score DECIMAL(3, 2),

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_pest_predictions_location_state ON admin_pest_pressure_predictions(location_state) WHERE location_state IS NOT NULL;
CREATE INDEX idx_admin_pest_predictions_location_city ON admin_pest_pressure_predictions(location_city) WHERE location_city IS NOT NULL;
CREATE INDEX idx_admin_pest_predictions_location_region ON admin_pest_pressure_predictions(location_region) WHERE location_region IS NOT NULL;
CREATE INDEX idx_admin_pest_predictions_pest_type ON admin_pest_pressure_predictions(pest_type);
CREATE INDEX idx_admin_pest_predictions_window ON admin_pest_pressure_predictions(prediction_window);
CREATE INDEX idx_admin_pest_predictions_valid ON admin_pest_pressure_predictions(valid_until);
CREATE INDEX idx_admin_pest_predictions_anomaly ON admin_pest_pressure_predictions(anomaly_detected) WHERE anomaly_detected = true;

COMMENT ON TABLE admin_pest_pressure_predictions IS 'Cross-company pest pressure predictions for admin analytics';
COMMENT ON COLUMN admin_pest_pressure_predictions.contributing_companies_count IS 'Number of companies that contributed data to this prediction';

-- ============================================================================
-- Helper Function: Get Data Points for Geographic Scope
-- ============================================================================

CREATE OR REPLACE FUNCTION get_admin_pest_data_points(
  p_geographic_scope VARCHAR,
  p_location_state VARCHAR DEFAULT NULL,
  p_location_city VARCHAR DEFAULT NULL,
  p_location_region VARCHAR DEFAULT NULL,
  p_pest_type VARCHAR DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  pest_type VARCHAR,
  city VARCHAR,
  state VARCHAR,
  lat DECIMAL,
  lng DECIMAL,
  urgency_level INT,
  observed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ppd.id,
    ppd.company_id,
    ppd.pest_type,
    ppd.city,
    ppd.state,
    ppd.lat,
    ppd.lng,
    ppd.urgency_level,
    ppd.observed_at
  FROM pest_pressure_data_points ppd
  WHERE
    -- Geographic filtering
    CASE
      WHEN p_geographic_scope = 'state' THEN ppd.state = p_location_state
      WHEN p_geographic_scope = 'city' THEN ppd.state = p_location_state AND ppd.city = p_location_city
      WHEN p_geographic_scope = 'region' THEN ppd.state = ANY(STRING_TO_ARRAY(p_location_region, ','))
      ELSE TRUE -- national
    END
    -- Pest type filtering
    AND (p_pest_type IS NULL OR ppd.pest_type = p_pest_type)
    -- Date range filtering
    AND (p_start_date IS NULL OR ppd.observed_at >= p_start_date)
    AND (p_end_date IS NULL OR ppd.observed_at <= p_end_date)
    -- Only include valid records
    AND ppd.state IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_admin_pest_data_points IS 'Retrieves pest pressure data points filtered by geographic scope for admin analytics';
