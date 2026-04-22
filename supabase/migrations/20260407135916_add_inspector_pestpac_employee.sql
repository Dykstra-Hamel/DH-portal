-- Add inspector department support and pestpac_employee_id for route lookup

-- Add pestpac_employee_id to user_companies so each user can have their
-- PestPac employee ID stored per-company (employee IDs are company-scoped)
ALTER TABLE user_companies ADD COLUMN IF NOT EXISTS pestpac_employee_id TEXT;

COMMENT ON COLUMN user_companies.pestpac_employee_id IS 'PestPac employee ID used to fetch the inspector''s daily route from PestPac';
