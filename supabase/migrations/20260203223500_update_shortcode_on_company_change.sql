-- Migration: Update Project Shortcode When Company Changes
-- Description: Adds trigger to regenerate shortcode when company_id is updated

-- Create/replace trigger function for company_id changes
CREATE OR REPLACE FUNCTION trigger_update_project_shortcode_on_company_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update shortcode if company_id changed and project has a type_code and name
  IF NEW.company_id IS DISTINCT FROM OLD.company_id
     AND NEW.type_code IS NOT NULL
     AND NEW.company_id IS NOT NULL
     AND NEW.name IS NOT NULL THEN
    NEW.shortcode := generate_project_shortcode(
      NEW.company_id,
      NEW.type_code,
      NEW.name
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_shortcode_on_company_change ON projects;

-- Create trigger on projects table for company_id changes
CREATE TRIGGER update_shortcode_on_company_change
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION trigger_update_project_shortcode_on_company_change();
