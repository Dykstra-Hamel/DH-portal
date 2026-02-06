-- Migration: Update Project Shortcode When Type Changes
-- Description: Updates trigger to regenerate shortcode when type_code changes, and adds 'SFT' to valid type codes

-- ============================================================================
-- 1. Update type_code constraint to include 'SFT' for Software projects
-- ============================================================================

-- Drop existing check constraint
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_type_code_check;

-- Add updated constraint with 'SFT' included
ALTER TABLE projects
ADD CONSTRAINT projects_type_code_check
CHECK (type_code IS NULL OR type_code IN ('WEB', 'SOC', 'EML', 'PRT', 'VEH', 'DIG', 'ADS', 'SFT'));

-- ============================================================================
-- 2. Update trigger to regenerate shortcode when type_code OR company_id changes
-- ============================================================================

-- Replace trigger function to handle both company_id and type_code changes
CREATE OR REPLACE FUNCTION trigger_update_project_shortcode_on_company_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update shortcode if company_id OR type_code changed, and project has required fields
  IF (NEW.company_id IS DISTINCT FROM OLD.company_id OR NEW.type_code IS DISTINCT FROM OLD.type_code)
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

-- Note: Trigger is already created, just updating the function

-- ============================================================================
-- Migration complete
-- ============================================================================
