-- Add department_type column to user_departments so technicians and inspectors
-- can be tagged as responsible for residential, commercial, or both properties.
-- Only used when a company opts in via the two new settings keys below.
ALTER TABLE user_departments
  ADD COLUMN IF NOT EXISTS department_type VARCHAR(20);

ALTER TABLE user_departments
  DROP CONSTRAINT IF EXISTS user_departments_department_type_check;

ALTER TABLE user_departments
  ADD CONSTRAINT user_departments_department_type_check
  CHECK (department_type IS NULL OR department_type IN ('residential', 'commercial', 'both'));

COMMENT ON COLUMN user_departments.department_type IS
  'Optional property-type scope for technician/inspector departments: residential, commercial, or both. NULL when the company has not enabled property-type categorization for this department.';

-- Seed the two new company settings for every existing company (default OFF).
INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT id, 'technician_property_type_enabled', 'false', 'boolean',
       'When enabled, technicians must be categorized as residential, commercial, or both'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;

INSERT INTO company_settings (company_id, setting_key, setting_value, setting_type, description)
SELECT id, 'inspector_property_type_enabled', 'false', 'boolean',
       'When enabled, inspectors must be categorized as residential, commercial, or both'
FROM companies
ON CONFLICT (company_id, setting_key) DO NOTHING;
