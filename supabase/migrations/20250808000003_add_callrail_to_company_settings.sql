-- Add CallRail API token to default company settings

-- Update the company creation trigger to include CallRail API token as a default setting
CREATE OR REPLACE FUNCTION create_default_company_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
    VALUES 
        (NEW.id, 'auto_call_enabled', 'true', 'boolean', 'Automatically initiate phone calls for new leads'),
        (NEW.id, 'business_hours_start', '09:00', 'string', 'Business hours start time (24h format)'),
        (NEW.id, 'business_hours_end', '17:00', 'string', 'Business hours end time (24h format)'),
        (NEW.id, 'call_throttle_minutes', '5', 'number', 'Minimum minutes between calls to same customer'),
        (NEW.id, 'weekend_calling_enabled', 'false', 'boolean', 'Allow calls on weekends'),
        (NEW.id, 'ga_property_id', '', 'string', 'Google Analytics 4 Property ID for website traffic analytics'),
        (NEW.id, 'callrail_api_token', '', 'string', 'CallRail API token for call tracking and analytics')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add CallRail API token setting to existing companies that don't have it
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'callrail_api_token',
    '',
    'string',
    'CallRail API token for call tracking and analytics'
FROM companies 
WHERE NOT EXISTS (
    SELECT 1 FROM company_settings 
    WHERE company_settings.company_id = companies.id 
    AND company_settings.setting_key = 'callrail_api_token'
);