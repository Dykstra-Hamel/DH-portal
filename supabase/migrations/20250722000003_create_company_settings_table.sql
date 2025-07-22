-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) NOT NULL DEFAULT 'string', -- 'string', 'boolean', 'number', 'json'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique setting keys per company
    UNIQUE(company_id, setting_key)
);

-- Add RLS policies
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Users can read settings for companies they belong to or if they're admin
CREATE POLICY "Users can read settings for their companies" ON company_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = company_settings.company_id 
            AND uc.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Users with manager/owner/admin roles in user_companies or global admins can modify settings
CREATE POLICY "Company admins can modify company settings" ON company_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_companies uc
            WHERE uc.company_id = company_settings.company_id 
            AND uc.user_id = auth.uid()
            AND uc.role IN ('admin', 'manager', 'owner')
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_company_settings_company_id ON company_settings(company_id);
CREATE INDEX idx_company_settings_setting_key ON company_settings(setting_key);

-- Insert default settings for existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'auto_call_enabled',
    'true',
    'boolean',
    'Automatically initiate phone calls for new leads'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'business_hours_start',
    '09:00',
    'string',
    'Business hours start time (24h format)'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'business_hours_end',
    '17:00',
    'string',
    'Business hours end time (24h format)'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'call_throttle_minutes',
    '5',
    'number',
    'Minimum minutes between calls to same customer'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'weekend_calling_enabled',
    'false',
    'boolean',
    'Allow calls on weekends'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Create trigger to automatically create default settings for new companies
CREATE OR REPLACE FUNCTION create_default_company_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
    VALUES 
        (NEW.id, 'auto_call_enabled', 'true', 'boolean', 'Automatically initiate phone calls for new leads'),
        (NEW.id, 'business_hours_start', '09:00', 'string', 'Business hours start time (24h format)'),
        (NEW.id, 'business_hours_end', '17:00', 'string', 'Business hours end time (24h format)'),
        (NEW.id, 'call_throttle_minutes', '5', 'number', 'Minimum minutes between calls to same customer'),
        (NEW.id, 'weekend_calling_enabled', 'false', 'boolean', 'Allow calls on weekends')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_company_settings_trigger
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION create_default_company_settings();