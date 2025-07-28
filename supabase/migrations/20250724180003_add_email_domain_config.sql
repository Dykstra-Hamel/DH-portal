-- Add email domain configuration settings to company_settings table
-- This follows the established pattern for company configuration

-- Insert email domain settings for existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'email_domain',
    '',
    'string',
    'Custom domain for sending emails (e.g., nwexterminating.com)'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'email_domain_status',
    'not_configured',
    'string',
    'Domain verification status: not_configured, pending, verified, failed, temporary_failure'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'email_domain_region',
    'us-east-1',
    'string',
    'Resend email sending region'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'email_domain_prefix',
    'noreply',
    'string',
    'Email address prefix (e.g., noreply creates noreply@domain.com)'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'email_domain_records',
    '[]',
    'json',
    'DNS records required for domain verification'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'resend_domain_id',
    '',
    'string',
    'Resend API domain identifier'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'email_domain_verified_at',
    '',
    'string',
    'Timestamp when domain was verified (ISO string)'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Update the default company settings trigger to include email domain settings
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
        (NEW.id, 'auto_contact_method', 'text', 'string', 'Preferred automatic contact method: text or call'),
        (NEW.id, 'email_domain', '', 'string', 'Custom domain for sending emails (e.g., nwexterminating.com)'),
        (NEW.id, 'email_domain_status', 'not_configured', 'string', 'Domain verification status: not_configured, pending, verified, failed, temporary_failure'),
        (NEW.id, 'email_domain_region', 'us-east-1', 'string', 'Resend email sending region'),
        (NEW.id, 'email_domain_prefix', 'noreply', 'string', 'Email address prefix (e.g., noreply creates noreply@domain.com)'),
        (NEW.id, 'email_domain_records', '[]', 'json', 'DNS records required for domain verification'),
        (NEW.id, 'resend_domain_id', '', 'string', 'Resend API domain identifier'),
        (NEW.id, 'email_domain_verified_at', '', 'string', 'Timestamp when domain was verified (ISO string)')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;