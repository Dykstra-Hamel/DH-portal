-- Add call summary email settings to company settings
-- This allows companies to configure automatic email notifications when calls are completed

-- Add call_summary_emails_enabled setting for existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'call_summary_emails_enabled',
    'false',
    'boolean',
    'Enable automatic call summary emails after calls are completed'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Add call_summary_email_recipients setting for existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'call_summary_email_recipients',
    '',
    'string',
    'Comma-separated list of email addresses to receive call summary notifications'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Update the trigger function to include new default settings for new companies
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
        (NEW.id, 'call_summary_emails_enabled', 'false', 'boolean', 'Enable automatic call summary emails after calls are completed'),
        (NEW.id, 'call_summary_email_recipients', '', 'string', 'Comma-separated list of email addresses to receive call summary notifications')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION create_default_company_settings() IS 'Creates default company settings including call summary email configuration for new companies';