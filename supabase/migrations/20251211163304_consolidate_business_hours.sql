-- Consolidate Business Hours Migration
-- This migration removes old individual day settings and creates new consolidated format

-- Step 1: Delete old individual day settings
DELETE FROM company_settings
WHERE setting_key IN (
    'business_hours_monday',
    'business_hours_tuesday',
    'business_hours_wednesday',
    'business_hours_thursday',
    'business_hours_friday',
    'business_hours_saturday',
    'business_hours_sunday'
);

-- Step 2: Insert default business hours for all companies in new consolidated format
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT
    c.id,
    'business_hours',
    '{"monday": {"start": "09:00", "end": "17:00", "closed": false}, "tuesday": {"start": "09:00", "end": "17:00", "closed": false}, "wednesday": {"start": "09:00", "end": "17:00", "closed": false}, "thursday": {"start": "09:00", "end": "17:00", "closed": false}, "friday": {"start": "09:00", "end": "17:00", "closed": false}, "saturday": {"start": "09:00", "end": "17:00", "closed": true}, "sunday": {"start": "09:00", "end": "17:00", "closed": true}}',
    'json',
    'Consolidated business hours for all days of the week'
FROM companies c
WHERE NOT EXISTS (
    SELECT 1 FROM company_settings cs
    WHERE cs.company_id = c.id AND cs.setting_key = 'business_hours'
)
ON CONFLICT (company_id, setting_key) DO NOTHING;

-- Step 3: Update the trigger function to create new format for new companies
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
        (NEW.id, 'off_hour_calling_enabled', 'true', 'boolean', 'Allow calls outside business hours and on weekends'),
        (NEW.id, 'company_timezone', 'America/New_York', 'string', 'Company timezone for business hours calculations (IANA timezone identifier)'),

        -- Retell settings
        (NEW.id, 'retell_api_key', '', 'string', 'Retell AI API key for this company account'),
        (NEW.id, 'retell_phone_number', '', 'string', 'Phone number to use for Retell AI calls from this company'),
        (NEW.id, 'retell_agent_id', '', 'string', 'Company-specific Retell AI agent ID'),
        (NEW.id, 'retell_inbound_agent_id', '', 'string', 'Retell AI agent ID for handling inbound calls'),
        (NEW.id, 'retell_outbound_agent_id', '', 'string', 'Retell AI agent ID for handling outbound calls from form submissions'),
        (NEW.id, 'retell_knowledge_base_id', '', 'string', 'Knowledge base ID for company-specific information'),
        (NEW.id, 'knowledge_base_enabled', 'false', 'boolean', 'Enable knowledge base functionality for Retell AI calls'),
        (NEW.id, 'knowledge_base_auto_refresh', 'true', 'boolean', 'Automatically sync knowledge base with Retell AI when changes are made'),

        -- Consolidated business hours (NEW FORMAT)
        (NEW.id, 'business_hours', '{"monday": {"start": "09:00", "end": "17:00", "closed": false}, "tuesday": {"start": "09:00", "end": "17:00", "closed": false}, "wednesday": {"start": "09:00", "end": "17:00", "closed": false}, "thursday": {"start": "09:00", "end": "17:00", "closed": false}, "friday": {"start": "09:00", "end": "17:00", "closed": false}, "saturday": {"start": "09:00", "end": "17:00", "closed": true}, "sunday": {"start": "09:00", "end": "17:00", "closed": true}}', 'json', 'Consolidated business hours for all days of the week'),

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
