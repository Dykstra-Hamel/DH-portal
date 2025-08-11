-- Add Google Analytics property ID field to companies table
ALTER TABLE companies ADD COLUMN ga_property_id VARCHAR(50);

-- Create index for efficient queries on GA property ID
CREATE INDEX IF NOT EXISTS idx_companies_ga_property ON companies(ga_property_id);