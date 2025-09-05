-- Set automation_enabled = true by default for new companies
-- This ensures new companies have automations working out of the box

-- Create function to insert default automation setting for new companies
CREATE OR REPLACE FUNCTION create_default_automation_setting()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert automation_enabled = true for the new company
    INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type)
    VALUES (NEW.id, 'automation_enabled', 'true', 'boolean')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS create_automation_setting_on_company_insert ON companies;
CREATE TRIGGER create_automation_setting_on_company_insert
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION create_default_automation_setting();

-- Set automation_enabled = true for any existing companies that don't have this setting
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type)
SELECT 
    c.id,
    'automation_enabled',
    'true',
    'boolean'
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM company_settings cs 
    WHERE cs.company_id = c.id 
    AND cs.setting_key = 'automation_enabled'
)
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Add comment documenting this change
COMMENT ON FUNCTION create_default_automation_setting() IS 'Automatically sets automation_enabled=true for new companies - added 2025-09-05';