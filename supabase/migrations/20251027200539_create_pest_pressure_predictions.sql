-- Create pest_pressure_predictions table for AI-generated predictions and anomaly alerts
-- This table stores forecasts and real-time anomaly detection results

CREATE TABLE pest_pressure_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

  -- Prediction scope
  pest_type VARCHAR(255) NOT NULL,
  location_city VARCHAR(255),
  location_state VARCHAR(2),
  prediction_window VARCHAR(10) NOT NULL CHECK (prediction_window IN ('7d', '30d', '90d')),

  -- Pressure metrics
  current_pressure DECIMAL(3, 1) CHECK (current_pressure BETWEEN 0 AND 10),
  predicted_pressure DECIMAL(3, 1) CHECK (predicted_pressure BETWEEN 0 AND 10),
  confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),

  -- Trend analysis
  trend VARCHAR(20) CHECK (trend IN ('increasing', 'stable', 'decreasing', 'spike')),
  trend_percentage DECIMAL(5, 2), -- e.g., +45.5 or -23.2

  -- Anomaly detection
  anomaly_detected BOOLEAN DEFAULT FALSE,
  anomaly_severity VARCHAR(20) CHECK (anomaly_severity IN ('low', 'medium', 'high', 'critical')),
  anomaly_description TEXT,

  -- Insights (natural language from Gemini)
  contributing_factors JSONB, -- Array of strings
  recommendations JSONB,       -- Array of strings

  -- Model metadata
  model_version VARCHAR(50),
  data_points_used INT,
  weather_influence_score DECIMAL(3, 2) CHECK (weather_influence_score BETWEEN 0 AND 1),

  -- Validity period
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,

  -- One prediction per company/pest/location/window per generation
  CONSTRAINT unique_prediction UNIQUE(company_id, pest_type, location_city, location_state, prediction_window, generated_at)
);

-- Create indexes for query performance
CREATE INDEX idx_predictions_company ON pest_pressure_predictions(company_id);
CREATE INDEX idx_predictions_pest_type ON pest_pressure_predictions(pest_type);
CREATE INDEX idx_predictions_location ON pest_pressure_predictions(location_city, location_state);
CREATE INDEX idx_predictions_window ON pest_pressure_predictions(prediction_window);
CREATE INDEX idx_predictions_valid ON pest_pressure_predictions(valid_until);
CREATE INDEX idx_predictions_generated ON pest_pressure_predictions(generated_at DESC);
CREATE INDEX idx_predictions_anomaly ON pest_pressure_predictions(anomaly_detected, anomaly_severity) WHERE anomaly_detected = TRUE;
CREATE INDEX idx_predictions_trend ON pest_pressure_predictions(trend);

-- Create GIN indexes for JSONB columns
CREATE INDEX idx_predictions_contributing_factors_gin ON pest_pressure_predictions USING GIN(contributing_factors);
CREATE INDEX idx_predictions_recommendations_gin ON pest_pressure_predictions USING GIN(recommendations);

-- Enable RLS
ALTER TABLE pest_pressure_predictions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view predictions for their companies" ON pest_pressure_predictions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage predictions" ON pest_pressure_predictions
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to clean up expired predictions
CREATE OR REPLACE FUNCTION cleanup_expired_predictions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete predictions that are no longer valid
  DELETE FROM pest_pressure_predictions
  WHERE valid_until < NOW() - INTERVAL '30 days'; -- Keep 30 days of history

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE pest_pressure_predictions IS 'AI-generated pest pressure predictions with forecasts, anomaly alerts, and natural language insights.';
COMMENT ON COLUMN pest_pressure_predictions.prediction_window IS 'Forecast window: 7d (short-term), 30d (medium-term), 90d (long-term)';
COMMENT ON COLUMN pest_pressure_predictions.current_pressure IS 'Current observed pressure 0-10 scale';
COMMENT ON COLUMN pest_pressure_predictions.predicted_pressure IS 'ML-predicted pressure for end of window';
COMMENT ON COLUMN pest_pressure_predictions.trend IS 'Pressure direction: increasing, stable, decreasing, or spike (anomaly)';
COMMENT ON COLUMN pest_pressure_predictions.trend_percentage IS 'Percentage change from current to predicted';
COMMENT ON COLUMN pest_pressure_predictions.anomaly_detected IS 'True if current activity is statistically anomalous';
COMMENT ON COLUMN pest_pressure_predictions.anomaly_severity IS 'How severe the anomaly is (only set if anomaly_detected=true)';
COMMENT ON COLUMN pest_pressure_predictions.contributing_factors IS 'Natural language array of factors (weather, seasonality, etc)';
COMMENT ON COLUMN pest_pressure_predictions.recommendations IS 'Natural language array of actionable recommendations';
COMMENT ON COLUMN pest_pressure_predictions.weather_influence_score IS 'How much weather impacted this prediction (0=none, 1=high)';
COMMENT ON COLUMN pest_pressure_predictions.data_points_used IS 'Number of historical observations used in prediction';
COMMENT ON COLUMN pest_pressure_predictions.valid_until IS 'When this prediction expires and should be regenerated';

COMMENT ON FUNCTION cleanup_expired_predictions IS 'Deletes predictions older than 30 days past their valid_until date. Run periodically.';
