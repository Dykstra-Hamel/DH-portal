-- Fix missing company settings for auto-call functionality
-- This will create default settings for companies that don't have them

-- Insert auto_call_enabled setting for companies that don't have it
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    c.id,
    'auto_call_enabled',
    'true',
    'boolean',
    'Automatically initiate phone calls for new leads'
FROM companies c
LEFT JOIN company_settings cs ON cs.company_id = c.id AND cs.setting_key = 'auto_call_enabled'
WHERE cs.id IS NULL;

-- Insert day-specific business hours for companies that don't have them
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    c.id,
    'business_hours_monday',
    '{"start": "09:00", "end": "17:00", "enabled": true}',
    'json',
    'Business hours for Monday'
FROM companies c
LEFT JOIN company_settings cs ON cs.company_id = c.id AND cs.setting_key = 'business_hours_monday'
WHERE cs.id IS NULL;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    c.id,
    'business_hours_tuesday',
    '{"start": "09:00", "end": "17:00", "enabled": true}',
    'json',
    'Business hours for Tuesday'
FROM companies c
LEFT JOIN company_settings cs ON cs.company_id = c.id AND cs.setting_key = 'business_hours_tuesday'
WHERE cs.id IS NULL;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    c.id,
    'business_hours_wednesday',
    '{"start": "09:00", "end": "17:00", "enabled": true}',
    'json',
    'Business hours for Wednesday'
FROM companies c
LEFT JOIN company_settings cs ON cs.company_id = c.id AND cs.setting_key = 'business_hours_wednesday'
WHERE cs.id IS NULL;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    c.id,
    'business_hours_thursday',
    '{"start": "09:00", "end": "17:00", "enabled": true}',
    'json',
    'Business hours for Thursday'
FROM companies c
LEFT JOIN company_settings cs ON cs.company_id = c.id AND cs.setting_key = 'business_hours_thursday'
WHERE cs.id IS NULL;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    c.id,
    'business_hours_friday',
    '{"start": "09:00", "end": "17:00", "enabled": true}',
    'json',
    'Business hours for Friday'
FROM companies c
LEFT JOIN company_settings cs ON cs.company_id = c.id AND cs.setting_key = 'business_hours_friday'
WHERE cs.id IS NULL;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    c.id,
    'business_hours_saturday',
    '{"start": "09:00", "end": "17:00", "enabled": false}',
    'json',
    'Business hours for Saturday'
FROM companies c
LEFT JOIN company_settings cs ON cs.company_id = c.id AND cs.setting_key = 'business_hours_saturday'
WHERE cs.id IS NULL;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    c.id,
    'business_hours_sunday',
    '{"start": "09:00", "end": "17:00", "enabled": false}',
    'json',
    'Business hours for Sunday'
FROM companies c
LEFT JOIN company_settings cs ON cs.company_id = c.id AND cs.setting_key = 'business_hours_sunday'
WHERE cs.id IS NULL;