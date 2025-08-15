-- Update existing companies to have off_hour_calling_enabled set to true by default
-- This ensures all companies have off-hour calling enabled unless explicitly disabled

UPDATE company_settings 
SET setting_value = 'true'
WHERE setting_key = 'off_hour_calling_enabled' 
  AND (setting_value = 'false' OR setting_value IS NULL);

-- Also ensure the setting exists for any companies that might not have it
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'off_hour_calling_enabled',
    'true',
    'boolean',
    'Allow calls outside business hours and on weekends'
FROM companies
WHERE id NOT IN (
    SELECT company_id 
    FROM company_settings 
    WHERE setting_key = 'off_hour_calling_enabled'
)
ON CONFLICT (company_id, setting_key) DO NOTHING;