-- Add manual Retell configuration settings to existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'retell_api_key',
    '',
    'string',
    'Retell AI API key for this company account'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'retell_phone_number',
    '',
    'string',
    'Phone number to use for Retell AI calls from this company'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Update the trigger function to include new Retell settings for new companies
CREATE OR REPLACE FUNCTION create_default_company_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
    VALUES 
        (NEW.id, 'auto_call_enabled', 'true', 'boolean', 'Automatically initiate phone calls for new leads'),
        (NEW.id, 'business_hours_start', '09:00', 'string', 'Business hours start time (24h format)'),
        (NEW.id, 'business_hours_end', '17:00', 'string', 'Business hours end time (24h format)'),
        (NEW.id, 'call_throttle_minutes', '5', 'number', 'Minimum minutes between calls to same customer'),
        (NEW.id, 'off_hour_calling_enabled', 'true', 'boolean', 'Allow calls outside business hours and on weekends'),
        (NEW.id, 'knowledge_base_enabled', 'false', 'boolean', 'Enable knowledge base functionality for Retell AI calls'),
        (NEW.id, 'knowledge_base_auto_refresh', 'true', 'boolean', 'Automatically sync knowledge base with Retell AI when changes are made'),
        (NEW.id, 'retell_knowledge_base_id', '', 'string', 'Retell AI knowledge base ID for this company'),
        (NEW.id, 'retell_agent_id', '', 'string', 'Company-specific Retell AI agent ID'),
        (NEW.id, 'retell_api_key', '', 'string', 'Retell AI API key for this company account'),
        (NEW.id, 'retell_phone_number', '', 'string', 'Phone number to use for Retell AI calls from this company')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;