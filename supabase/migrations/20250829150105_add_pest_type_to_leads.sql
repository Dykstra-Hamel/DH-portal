-- Add pest_type column to leads table for storing selected pest type from widget
-- This allows for better searchability and reporting compared to storing only in notes

-- Add pest_type column as nullable varchar
ALTER TABLE leads 
ADD COLUMN pest_type VARCHAR(255) NULL;

-- Add index for better query performance
CREATE INDEX idx_leads_pest_type ON leads(pest_type);

-- Add comment to document the purpose
COMMENT ON COLUMN leads.pest_type IS 'Pest type selected by user in widget form (e.g., ants, spiders, roaches)';