-- Move GA Property ID from companies table to company_settings table

-- Insert existing GA property IDs into company_settings
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'ga_property_id',
    ga_property_id,
    'string',
    'Google Analytics 4 Property ID for website traffic analytics'
FROM companies 
WHERE ga_property_id IS NOT NULL AND ga_property_id != ''
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Remove ga_property_id column from companies table
ALTER TABLE companies DROP COLUMN IF EXISTS ga_property_id;

-- Remove the index we created earlier
DROP INDEX IF EXISTS idx_companies_ga_property;

-- Update the company creation trigger to include GA property ID as a default setting
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
        (NEW.id, 'ga_property_id', '', 'string', 'Google Analytics 4 Property ID for website traffic analytics')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;