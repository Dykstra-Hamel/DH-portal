-- Fix the shortcode trigger - use 'name' column instead of 'project_name'

CREATE OR REPLACE FUNCTION trigger_generate_project_shortcode()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if type_code is provided and shortcode is not set
  IF NEW.type_code IS NOT NULL AND NEW.shortcode IS NULL THEN
    NEW.shortcode := generate_project_shortcode(
      NEW.company_id,
      NEW.type_code,
      NEW.name  -- FIX: Changed from NEW.project_name to NEW.name
    );
  END IF;

  RETURN NEW;
END;
$$;
