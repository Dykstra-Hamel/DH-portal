-- Migration: Update Project Shortcode to Include Categories
-- Description: Changes shortcode pattern from {company}_{type}{year}_{name} to {company}_{type}{year} - {categories}

-- ============================================================================
-- 1. Update the shortcode generation function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_project_shortcode(
  p_company_id UUID,
  p_type_code TEXT,
  p_project_id UUID DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_code TEXT;
  v_year TEXT;
  v_categories TEXT;
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

  -- Get categories if project_id is provided
  IF p_project_id IS NOT NULL THEN
    SELECT string_agg(pc.name, ', ' ORDER BY pc.name)
    INTO v_categories
    FROM project_category_assignments pca
    JOIN project_categories pc ON pc.id = pca.category_id
    WHERE pca.project_id = p_project_id;
  END IF;

  -- Build shortcode: {company}_{type}{year} - {categories}
  v_shortcode := v_company_code || '_' || p_type_code || v_year;

  -- Append categories if available
  IF v_categories IS NOT NULL AND v_categories != '' THEN
    v_shortcode := v_shortcode || ' - ' || v_categories;
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
    -- Generate shortcode without categories initially (categories assigned after insert)
    NEW.shortcode := generate_project_shortcode(
      NEW.company_id,
      NEW.type_code,
      NULL  -- No project_id yet, categories will be added by category trigger
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. Create trigger to update shortcode when categories change
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_project_shortcode_on_category_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_project_id UUID;
  v_company_id UUID;
  v_type_code TEXT;
  v_new_shortcode TEXT;
BEGIN
  -- Get the project_id from the trigger operation
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
  ELSE
    v_project_id := NEW.project_id;
  END IF;

  -- Get the project's company_id and type_code
  SELECT company_id, type_code
  INTO v_company_id, v_type_code
  FROM projects
  WHERE id = v_project_id;

  -- Only update if project has a type_code (shortcode-enabled)
  IF v_type_code IS NOT NULL AND v_company_id IS NOT NULL THEN
    -- Generate new shortcode with updated categories
    v_new_shortcode := generate_project_shortcode(
      v_company_id,
      v_type_code,
      v_project_id
    );

    -- Update the project's shortcode
    UPDATE projects
    SET shortcode = v_new_shortcode
    WHERE id = v_project_id;
  END IF;

  -- Return appropriate value based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger on project_category_assignments table
DROP TRIGGER IF EXISTS update_shortcode_on_category_change ON project_category_assignments;

CREATE TRIGGER update_shortcode_on_category_change
AFTER INSERT OR DELETE ON project_category_assignments
FOR EACH ROW
EXECUTE FUNCTION trigger_update_project_shortcode_on_category_change();

-- ============================================================================
-- 4. Update existing projects with new shortcode format (optional)
-- ============================================================================

-- This updates all existing projects that have a type_code to use the new format
-- Uncomment if you want to migrate existing shortcodes:

-- UPDATE projects p
-- SET shortcode = generate_project_shortcode(p.company_id, p.type_code, p.id)
-- WHERE p.type_code IS NOT NULL
-- AND p.company_id IS NOT NULL;

-- ============================================================================
-- Migration complete
-- ============================================================================
