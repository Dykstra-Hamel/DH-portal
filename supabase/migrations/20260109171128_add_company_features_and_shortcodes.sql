-- Migration: Add Company Features and Project Shortcodes
-- Description: Implements company features system (like user_departments) and project shortcode auto-generation

-- ============================================================================
-- 1. Add short_code to company_settings table
-- ============================================================================

-- Note: short_code will be stored in company_settings table
-- with setting_key='short_code', setting_type='string', setting_value='<CODE>'
-- Validation will be handled at the application level

-- ============================================================================
-- 2. Add type_code and shortcode columns to projects table
-- ============================================================================

-- Add type_code column (nullable for existing projects)
ALTER TABLE projects
ADD COLUMN type_code TEXT;

-- Add shortcode column (unique, nullable initially)
ALTER TABLE projects
ADD COLUMN shortcode TEXT;

-- Add unique constraint on shortcode
CREATE UNIQUE INDEX projects_shortcode_key
ON projects(shortcode)
WHERE shortcode IS NOT NULL;

-- Add check constraint for valid type codes
ALTER TABLE projects
ADD CONSTRAINT projects_type_code_check
CHECK (type_code IS NULL OR type_code IN ('WEB', 'SOC', 'EML', 'PRT', 'VEH', 'DIG', 'ADS'));

-- ============================================================================
-- 3. Create company_features junction table
-- ============================================================================

CREATE TABLE company_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, feature)
);

-- Add indexes for faster lookups
CREATE INDEX idx_company_features_company_id ON company_features(company_id);
CREATE INDEX idx_company_features_feature ON company_features(feature);

-- ============================================================================
-- 4. Enable RLS on company_features table
-- ============================================================================

ALTER TABLE company_features ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage company features"
ON company_features
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Users can view their company's features
CREATE POLICY "Users can view their company features"
ON company_features
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 5. Create helper function for feature checking
-- ============================================================================

CREATE OR REPLACE FUNCTION has_company_feature(
  p_company_id UUID,
  p_feature TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM company_features
    WHERE company_id = p_company_id
    AND feature = p_feature
    AND enabled = true
  );
END;
$$;

-- ============================================================================
-- 6. Create shortcode generation function
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_project_shortcode(
  p_company_id UUID,
  p_type_code TEXT,
  p_project_name TEXT
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_code TEXT;
  v_year TEXT;
  v_clean_name TEXT;
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

  -- Clean project name: replace spaces/special chars with empty string, take first 20 chars
  v_clean_name := regexp_replace(p_project_name, '[^a-zA-Z0-9]', '', 'g');
  v_clean_name := substring(v_clean_name FROM 1 FOR 20);

  -- Build shortcode
  v_shortcode := v_company_code || '_' || p_type_code || v_year || '_' || v_clean_name;

  RETURN v_shortcode;
END;
$$;

-- ============================================================================
-- 7. Create trigger for auto-generating shortcode on project insert
-- ============================================================================

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
      NEW.project_name
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to projects table
CREATE TRIGGER generate_shortcode_on_insert
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION trigger_generate_project_shortcode();

-- ============================================================================
-- Migration complete
-- ============================================================================
