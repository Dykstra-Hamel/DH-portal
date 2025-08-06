-- Migration: Add protection for critical system settings
-- Prevent accidental deletion of the widget_allowed_domains setting

-- Create a function to prevent deletion of critical settings
CREATE OR REPLACE FUNCTION prevent_critical_setting_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent deletion of widget_allowed_domains setting
  IF OLD.key = 'widget_allowed_domains' THEN
    RAISE EXCEPTION 'Cannot delete critical system setting: widget_allowed_domains. This setting is required for widget security.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent deletion of critical settings
CREATE TRIGGER prevent_critical_setting_deletion_trigger
  BEFORE DELETE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_critical_setting_deletion();

-- Also create a function to restore missing critical settings
CREATE OR REPLACE FUNCTION restore_missing_critical_settings()
RETURNS void AS $$
BEGIN
  -- Ensure widget_allowed_domains setting exists
  INSERT INTO system_settings (key, value, description)
  VALUES (
    'widget_allowed_domains',
    '[]'::jsonb,
    'Global whitelist of domains allowed to embed widgets. Any domain in this list can embed widgets for any company.'
  ) ON CONFLICT (key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Run the restore function now
SELECT restore_missing_critical_settings();