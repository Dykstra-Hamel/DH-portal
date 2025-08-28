-- Add support for multiple Google Places IDs per company
-- This migration adds a new table to store multiple Google Places listings
-- and updates the existing company settings structure

-- Create table for multiple Google Places listings
CREATE TABLE IF NOT EXISTS google_places_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  place_id VARCHAR(255) NOT NULL,
  place_name VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_places_listings_company_id ON google_places_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_google_places_listings_place_id ON google_places_listings(place_id);

-- Migrate existing single Google Place ID to the new table structure
INSERT INTO google_places_listings (company_id, place_id, is_primary)
SELECT 
  c.id as company_id,
  cs.setting_value as place_id,
  true as is_primary
FROM companies c
JOIN company_settings cs ON cs.company_id = c.id
WHERE cs.setting_key = 'google_place_id' 
  AND cs.setting_value IS NOT NULL 
  AND cs.setting_value != ''
  AND NOT EXISTS (
    SELECT 1 FROM google_places_listings gpl 
    WHERE gpl.company_id = c.id
  );

-- Update the cached reviews data structure to support multiple listings
-- The existing 'google_reviews_data' will now store aggregated data from all listings
COMMENT ON TABLE google_places_listings IS 'Stores multiple Google Places listings per company for aggregated reviews display';

-- Add trigger to update timestamps
CREATE OR REPLACE FUNCTION update_google_places_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_google_places_listings_updated_at
  BEFORE UPDATE ON google_places_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_google_places_listings_updated_at();

-- Update the default company settings function to not create google_place_id anymore
-- since we're using the new table structure
CREATE OR REPLACE FUNCTION create_default_company_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
    VALUES 
        (NEW.id, 'auto_call_enabled', 'true', 'boolean', 'Automatically initiate phone calls for new leads'),
        (NEW.id, 'business_hours_start', '09:00', 'string', 'Business hours start time (24h format)'),
        (NEW.id, 'business_hours_end', '17:00', 'string', 'Business hours end time (24h format)'),
        (NEW.id, 'call_throttle_minutes', '5', 'number', 'Minimum minutes between calls to same customer'),
        (NEW.id, 'callrail_api_token', '', 'string', 'CallRail API token for call tracking and analytics'),
        (NEW.id, 'call_summary_emails_enabled', 'false', 'boolean', 'Enable automatic call summary emails after calls are completed'),
        (NEW.id, 'call_summary_email_recipients', '', 'string', 'Comma-separated list of email addresses to receive call summary notifications'),
        (NEW.id, 'google_reviews_data', '{}', 'json', 'Cached Google Reviews data including aggregated rating, review count, and last updated timestamp')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION create_default_company_settings() IS 'Creates default company settings for new companies, now excluding individual google_place_id as we use the google_places_listings table';