-- Disable automatic creation of default email templates and automation workflows for new companies
-- This allows new companies to start with a clean slate instead of pre-populated default content

-- Remove the trigger that creates default email templates when companies are created
DROP TRIGGER IF EXISTS create_templates_on_company_insert ON companies;

-- Remove the trigger that creates default automation workflows when companies are created  
DROP TRIGGER IF EXISTS create_workflows_on_company_insert ON companies;

-- NOTE: The underlying functions are preserved for optional manual use:
-- - create_default_email_templates(company_id UUID) 
-- - create_default_automation_workflows(company_id UUID)
-- These can still be called manually if a company wants to add default templates/workflows later

-- Add comment documenting this change
COMMENT ON TABLE companies IS 'Company information - Default automation triggers removed 2025-09-05 to allow clean company creation';