-- Add Google Places ID and reviews data settings to company settings
-- This allows companies to configure their Google Place ID for reviews display

-- Add Google Places ID setting for existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'google_place_id',
    '',
    'string',
    'Google Places ID for fetching business reviews and rating data'
FROM companies 
WHERE NOT EXISTS (
    SELECT 1 FROM company_settings 
    WHERE company_settings.company_id = companies.id 
    AND company_settings.setting_key = 'google_place_id'
);

-- Add Google Reviews data cache setting for existing companies  
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'google_reviews_data',
    '{}',
    'json',
    'Cached Google Reviews data including rating, review count, and last updated timestamp'
FROM companies 
WHERE NOT EXISTS (
    SELECT 1 FROM company_settings 
    WHERE company_settings.company_id = companies.id 
    AND company_settings.setting_key = 'google_reviews_data'
);

-- Update the trigger function to include Google Places settings for new companies
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
        (NEW.id, 'google_place_id', '', 'string', 'Google Places ID for fetching business reviews and rating data'),
        (NEW.id, 'google_reviews_data', '{}', 'json', 'Cached Google Reviews data including rating, review count, and last updated timestamp')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION create_default_company_settings() IS 'Creates default company settings including Google Places configuration for new companies';