-- Add company-level logo override for email templates
-- This allows companies to override the brand logo for all their email templates

-- Add logo_override_url field to company_settings table
ALTER TABLE company_settings 
ADD COLUMN logo_override_url TEXT;

-- Add comment to document the field
COMMENT ON COLUMN company_settings.logo_override_url IS 'URL to custom logo that overrides the brand logo for all email templates for this company. Stored in company-specific folder within brand-assets bucket.';