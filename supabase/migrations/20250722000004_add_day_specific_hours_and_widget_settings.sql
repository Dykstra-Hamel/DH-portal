-- Add day-specific business hours and widget form settings

-- Insert day-specific business hours settings for existing companies
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'business_hours_monday',
    '{"start": "09:00", "end": "17:00", "enabled": true}',
    'json',
    'Business hours for Monday'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'business_hours_tuesday',
    '{"start": "09:00", "end": "17:00", "enabled": true}',
    'json',
    'Business hours for Tuesday'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'business_hours_wednesday',
    '{"start": "09:00", "end": "17:00", "enabled": true}',
    'json',
    'Business hours for Wednesday'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'business_hours_thursday',
    '{"start": "09:00", "end": "17:00", "enabled": true}',
    'json',
    'Business hours for Thursday'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'business_hours_friday',
    '{"start": "09:00", "end": "17:00", "enabled": true}',
    'json',
    'Business hours for Friday'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'business_hours_saturday',
    '{"start": "09:00", "end": "17:00", "enabled": false}',
    'json',
    'Business hours for Saturday'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'business_hours_sunday',
    '{"start": "09:00", "end": "17:00", "enabled": false}',
    'json',
    'Business hours for Sunday'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Add widget form settings
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'widget_form_enabled',
    'true',
    'boolean',
    'Enable the widget form for lead capture'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'widget_form_title',
    'Get Your Free Pest Control Quote',
    'string',
    'Title displayed on the widget form'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'widget_form_description',
    'Fill out this form to get a customized quote for your pest control needs.',
    'string',
    'Description text shown on the widget form'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'widget_form_button_text',
    'Get My Quote',
    'string',
    'Text for the submit button on the widget form'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Insert widget form colors with brand colors as defaults where available
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    c.id,
    'widget_form_colors',
    COALESCE(
        CASE 
            WHEN b.primary_color_hex IS NOT NULL AND b.secondary_color_hex IS NOT NULL THEN
                '{"primary": "' || b.primary_color_hex || '", "secondary": "' || b.secondary_color_hex || '", "background": "#ffffff", "text": "#374151"}'
            WHEN b.primary_color_hex IS NOT NULL THEN
                '{"primary": "' || b.primary_color_hex || '", "secondary": "#1e293b", "background": "#ffffff", "text": "#374151"}'
            ELSE
                '{"primary": "#3b82f6", "secondary": "#1e293b", "background": "#ffffff", "text": "#374151"}'
        END,
        '{"primary": "#3b82f6", "secondary": "#1e293b", "background": "#ffffff", "text": "#374151"}'
    ),
    'json',
    'Color scheme for the widget form'
FROM companies c
LEFT JOIN brands b ON b.company_id = c.id
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'widget_form_required_fields',
    '["name", "email", "phone", "pestIssue"]',
    'json',
    'List of required fields for the widget form'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'widget_form_success_message',
    'Thank you! Your information has been submitted successfully. We will contact you soon.',
    'string',
    'Message shown after successful form submission'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT 
    id,
    'widget_form_lead_priority',
    'medium',
    'string',
    'Default priority for leads created from widget form'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Update the trigger function to include new settings with brand color integration
CREATE OR REPLACE FUNCTION create_default_company_settings()
RETURNS TRIGGER AS $$
DECLARE
    brand_primary_color VARCHAR(7);
    brand_secondary_color VARCHAR(7);
    widget_colors_json TEXT;
BEGIN
    -- Get brand colors if they exist
    SELECT primary_color_hex, secondary_color_hex 
    INTO brand_primary_color, brand_secondary_color
    FROM brands 
    WHERE company_id = NEW.id;
    
    -- Create widget colors JSON with brand colors or defaults
    IF brand_primary_color IS NOT NULL AND brand_secondary_color IS NOT NULL THEN
        widget_colors_json := '{"primary": "' || brand_primary_color || '", "secondary": "' || brand_secondary_color || '", "background": "#ffffff", "text": "#374151"}';
    ELSIF brand_primary_color IS NOT NULL THEN
        widget_colors_json := '{"primary": "' || brand_primary_color || '", "secondary": "#1e293b", "background": "#ffffff", "text": "#374151"}';
    ELSE
        widget_colors_json := '{"primary": "#3b82f6", "secondary": "#1e293b", "background": "#ffffff", "text": "#374151"}';
    END IF;

    INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
    VALUES 
        -- Phone call settings
        (NEW.id, 'auto_call_enabled', 'true', 'boolean', 'Automatically initiate phone calls for new leads'),
        (NEW.id, 'call_throttle_minutes', '5', 'number', 'Minimum minutes between calls to same customer'),
        (NEW.id, 'weekend_calling_enabled', 'false', 'boolean', 'Allow calls on weekends'),
        
        -- Day-specific business hours
        (NEW.id, 'business_hours_monday', '{"start": "09:00", "end": "17:00", "enabled": true}', 'json', 'Business hours for Monday'),
        (NEW.id, 'business_hours_tuesday', '{"start": "09:00", "end": "17:00", "enabled": true}', 'json', 'Business hours for Tuesday'),
        (NEW.id, 'business_hours_wednesday', '{"start": "09:00", "end": "17:00", "enabled": true}', 'json', 'Business hours for Wednesday'),
        (NEW.id, 'business_hours_thursday', '{"start": "09:00", "end": "17:00", "enabled": true}', 'json', 'Business hours for Thursday'),
        (NEW.id, 'business_hours_friday', '{"start": "09:00", "end": "17:00", "enabled": true}', 'json', 'Business hours for Friday'),
        (NEW.id, 'business_hours_saturday', '{"start": "09:00", "end": "17:00", "enabled": false}', 'json', 'Business hours for Saturday'),
        (NEW.id, 'business_hours_sunday', '{"start": "09:00", "end": "17:00", "enabled": false}', 'json', 'Business hours for Sunday'),
        
        -- Widget form settings
        (NEW.id, 'widget_form_enabled', 'true', 'boolean', 'Enable the widget form for lead capture'),
        (NEW.id, 'widget_form_title', 'Get Your Free Pest Control Quote', 'string', 'Title displayed on the widget form'),
        (NEW.id, 'widget_form_description', 'Fill out this form to get a customized quote for your pest control needs.', 'string', 'Description text shown on the widget form'),
        (NEW.id, 'widget_form_button_text', 'Get My Quote', 'string', 'Text for the submit button on the widget form'),
        (NEW.id, 'widget_form_colors', widget_colors_json, 'json', 'Color scheme for the widget form'),
        (NEW.id, 'widget_form_required_fields', '["name", "email", "phone", "pestIssue"]', 'json', 'List of required fields for the widget form'),
        (NEW.id, 'widget_form_success_message', 'Thank you! Your information has been submitted successfully. We will contact you soon.', 'string', 'Message shown after successful form submission'),
        (NEW.id, 'widget_form_lead_priority', 'medium', 'string', 'Default priority for leads created from widget form')
    ON CONFLICT (company_id, setting_key) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;