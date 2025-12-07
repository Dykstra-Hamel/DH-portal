-- Create pest_pressure_ml_models table to track ML model versions and performance
-- Stores lightweight statistical model parameters (no external files needed)

CREATE TABLE pest_pressure_ml_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  -- Model identification
  model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('seasonal_forecast', 'anomaly_detection')),
  model_version VARCHAR(50) NOT NULL,
  pest_type VARCHAR(255), -- NULL = all pests combined, or specific pest type

  -- Model parameters (stored as lightweight JSON, no file storage needed)
  model_parameters JSONB NOT NULL,

  -- Training metadata
  training_data_count INT,
  training_date_range JSONB, -- {start: "2023-01-01", end: "2025-01-01"}
  accuracy_metrics JSONB,     -- {mae: 0.5, rmse: 0.7, r_squared: 0.85}

  -- Status
  trained_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,

  -- Only one active model per company/type/pest combination
  -- Use DEFERRABLE to allow updates without conflicts
  CONSTRAINT unique_active_model UNIQUE(company_id, model_type, pest_type, is_active)
    DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for query performance
CREATE INDEX idx_ml_models_company ON pest_pressure_ml_models(company_id);
CREATE INDEX idx_ml_models_type ON pest_pressure_ml_models(model_type);
CREATE INDEX idx_ml_models_pest_type ON pest_pressure_ml_models(pest_type);
CREATE INDEX idx_ml_models_active ON pest_pressure_ml_models(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ml_models_trained_at ON pest_pressure_ml_models(trained_at DESC);
CREATE INDEX idx_ml_models_version ON pest_pressure_ml_models(model_version);

-- Create GIN index for model parameters queries
CREATE INDEX idx_ml_models_parameters_gin ON pest_pressure_ml_models USING GIN(model_parameters);

-- Enable RLS
ALTER TABLE pest_pressure_ml_models ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view ML models for their companies" ON pest_pressure_ml_models
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage ML models" ON pest_pressure_ml_models
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to activate a model and deactivate others
CREATE OR REPLACE FUNCTION activate_ml_model(
  model_id UUID
)
RETURNS VOID AS $$
DECLARE
  target_company_id UUID;
  target_model_type VARCHAR(50);
  target_pest_type VARCHAR(255);
BEGIN
  -- Get model details
  SELECT company_id, model_type, pest_type
  INTO target_company_id, target_model_type, target_pest_type
  FROM pest_pressure_ml_models
  WHERE id = model_id;

  IF target_company_id IS NULL THEN
    RAISE EXCEPTION 'Model not found: %', model_id;
  END IF;

  -- Deactivate all other models of same type/pest/company
  UPDATE pest_pressure_ml_models
  SET is_active = FALSE
  WHERE company_id = target_company_id
    AND model_type = target_model_type
    AND (pest_type = target_pest_type OR (pest_type IS NULL AND target_pest_type IS NULL))
    AND id != model_id;

  -- Activate target model
  UPDATE pest_pressure_ml_models
  SET is_active = TRUE
  WHERE id = model_id;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE pest_pressure_ml_models IS 'ML model storage with versioning and performance tracking. Models are lightweight statistical parameters stored as JSON.';
COMMENT ON COLUMN pest_pressure_ml_models.model_type IS 'seasonal_forecast (time-series) or anomaly_detection (outlier detection)';
COMMENT ON COLUMN pest_pressure_ml_models.pest_type IS 'NULL for all-pest models, or specific pest type (ants, termites, etc)';
COMMENT ON COLUMN pest_pressure_ml_models.model_parameters IS 'Statistical model parameters: baseline, seasonal_factors, trend, weather_coefficients, etc';
COMMENT ON COLUMN pest_pressure_ml_models.training_data_count IS 'Number of data points used for training';
COMMENT ON COLUMN pest_pressure_ml_models.accuracy_metrics IS 'Performance metrics: MAE (mean absolute error), RMSE (root mean square error), R² (coefficient of determination)';
COMMENT ON COLUMN pest_pressure_ml_models.is_active IS 'Only one active model per company/type/pest. Use activate_ml_model() to switch.';

COMMENT ON FUNCTION activate_ml_model IS 'Activates a model and deactivates others of same type/pest/company. Use when deploying new model version.';

-- Create view for easy model lookup
CREATE OR REPLACE VIEW active_pest_pressure_models AS
SELECT
  id,
  company_id,
  model_type,
  pest_type,
  model_version,
  model_parameters,
  training_data_count,
  accuracy_metrics,
  trained_at
FROM pest_pressure_ml_models
WHERE is_active = TRUE;

COMMENT ON VIEW active_pest_pressure_models IS 'Quick lookup for active models only. Used by prediction generation.';
