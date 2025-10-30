-- Create pest_pressure_data_points table for AI-powered pest pressure prediction system
-- This table stores historical pest observations with source tracking to prevent duplicates

CREATE TABLE pest_pressure_data_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

  -- Source tracking (ensures no duplicates via UNIQUE constraint)
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('call', 'form', 'lead', 'manual')),
  source_id UUID NOT NULL,

  -- Pest data
  pest_type VARCHAR(255) NOT NULL,
  pest_mentions_count INT DEFAULT 1 CHECK (pest_mentions_count > 0),

  -- Location data (for geographic analysis)
  city VARCHAR(255),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  service_area_name VARCHAR(255),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),

  -- Pressure indicators
  urgency_level INT CHECK (urgency_level BETWEEN 1 AND 10),
  infestation_severity VARCHAR(20) CHECK (infestation_severity IN ('minor', 'moderate', 'severe', 'critical')),

  -- AI analysis context from Gemini
  ai_extracted_context JSONB,
  confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),

  -- Temporal tracking
  observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- CRITICAL: Prevent duplicates - one data point per source entity per pest
  UNIQUE(source_type, source_id, pest_type)
);

-- Create indexes for query performance
CREATE INDEX idx_pest_pressure_company ON pest_pressure_data_points(company_id);
CREATE INDEX idx_pest_pressure_pest_type ON pest_pressure_data_points(pest_type);
CREATE INDEX idx_pest_pressure_location ON pest_pressure_data_points(city, state);
CREATE INDEX idx_pest_pressure_observed_at ON pest_pressure_data_points(observed_at DESC);
CREATE INDEX idx_pest_pressure_company_observed ON pest_pressure_data_points(company_id, observed_at DESC);
CREATE INDEX idx_pest_pressure_severity ON pest_pressure_data_points(infestation_severity);
CREATE INDEX idx_pest_pressure_urgency ON pest_pressure_data_points(urgency_level DESC);
CREATE INDEX idx_pest_pressure_geo ON pest_pressure_data_points(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX idx_pest_pressure_source ON pest_pressure_data_points(source_type, source_id);

-- Create GIN index for JSONB context queries
CREATE INDEX idx_pest_pressure_context_gin ON pest_pressure_data_points USING GIN(ai_extracted_context);

-- Enable RLS
ALTER TABLE pest_pressure_data_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view pest pressure data for their companies" ON pest_pressure_data_points
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage pest pressure data" ON pest_pressure_data_points
  FOR ALL USING (auth.role() = 'service_role');

-- Add helpful comments
COMMENT ON TABLE pest_pressure_data_points IS 'Historical pest observations for AI prediction system. Uses source hierarchy (call > form > lead) to prevent duplicates.';
COMMENT ON COLUMN pest_pressure_data_points.source_type IS 'Source of observation: call (transcript), form (submission), lead (manual), or manual entry';
COMMENT ON COLUMN pest_pressure_data_points.source_id IS 'ID of source record (call_record, form_submission, or lead)';
COMMENT ON COLUMN pest_pressure_data_points.pest_mentions_count IS 'How many times pest was mentioned in call transcript (1 for forms/leads)';
COMMENT ON COLUMN pest_pressure_data_points.urgency_level IS 'Customer urgency 1-10 derived from sentiment/keywords';
COMMENT ON COLUMN pest_pressure_data_points.ai_extracted_context IS 'Gemini AI analysis: symptoms, location_in_home, duration, customer_concerns';
COMMENT ON COLUMN pest_pressure_data_points.confidence_score IS 'AI confidence in extraction quality (0.0-1.0)';
COMMENT ON COLUMN pest_pressure_data_points.observed_at IS 'When the interaction happened (not when data point was created)';
