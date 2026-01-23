-- Migration: Update Project Shortcode to Include Project Name
-- Description: Changes shortcode pattern from {company}_{type}{year} - {categories}
--              to {company}_{type}{year}_{project_name}
-- Example: PMP_WEB25_Dashboard for Tickets

-- ============================================================================
-- 1. Update the shortcode generation function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_project_shortcode(
  p_company_id UUID,
  p_type_code TEXT,
  p_project_name TEXT DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_code TEXT;
  v_year TEXT;
  v_shortcode TEXT;
BEGIN
  -- Get company short_code from company_settings table
  SELECT setting_value INTO v_company_code
  FROM company_settings
  WHERE company_id = p_company_id
  AND setting_key = 'short_code';

  -- Fail if company doesn't have short_code
  IF v_company_code IS NULL OR v_company_code = '' THEN
    RAISE EXCEPTION 'Company must have a short_code before creating projects';
  END IF;

  -- Get current year (last 2 digits)
  v_year := to_char(CURRENT_DATE, 'YY');

  -- Build shortcode: {company}_{type}{year}_{project_name}
  v_shortcode := v_company_code || '_' || p_type_code || v_year;

  -- Append project name if provided
  IF p_project_name IS NOT NULL AND p_project_name != '' THEN
    v_shortcode := v_shortcode || '_' || p_project_name;
  END IF;

  RETURN v_shortcode;
END;
$$;

-- ============================================================================
-- 2. Update the trigger function for project insert
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_generate_project_shortcode()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if type_code is provided and shortcode is not set
  IF NEW.type_code IS NOT NULL AND NEW.shortcode IS NULL THEN
    -- Generate shortcode with project name
    NEW.shortcode := generate_project_shortcode(
      NEW.company_id,
      NEW.type_code,
      NEW.name
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. Create trigger to update shortcode when project name changes
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_project_shortcode_on_name_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update shortcode if name changed and project has a type_code
  IF NEW.name IS DISTINCT FROM OLD.name AND NEW.type_code IS NOT NULL AND NEW.company_id IS NOT NULL THEN
    NEW.shortcode := generate_project_shortcode(
      NEW.company_id,
      NEW.type_code,
      NEW.name
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop the old category-based trigger if it exists
DROP TRIGGER IF EXISTS update_shortcode_on_category_change ON project_category_assignments;

-- Drop old function that is no longer needed
DROP FUNCTION IF EXISTS trigger_update_project_shortcode_on_category_change();

-- Create/replace trigger on projects table for name changes
DROP TRIGGER IF EXISTS update_shortcode_on_name_change ON projects;

CREATE TRIGGER update_shortcode_on_name_change
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION trigger_update_project_shortcode_on_name_change();

-- ============================================================================
-- 4. Update existing projects with new shortcode format
-- ============================================================================

-- Update all existing projects that have a type_code to use the new format
UPDATE projects p
SET shortcode = generate_project_shortcode(p.company_id, p.type_code, p.name)
WHERE p.type_code IS NOT NULL
AND p.company_id IS NOT NULL;

-- ============================================================================
-- Migration complete
-- ============================================================================
