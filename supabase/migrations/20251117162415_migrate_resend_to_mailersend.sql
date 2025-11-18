-- Migration: Migrate Resend domain configuration to MailerSend
-- This migration updates company_settings to use MailerSend instead of Resend for email domains

-- Update setting_key from resend_domain_id to mailersend_domain_id
UPDATE company_settings
SET
  setting_key = 'mailersend_domain_id',
  description = 'MailerSend domain ID for custom email sending',
  setting_value = '' -- Clear existing Resend domain IDs as they're incompatible
WHERE setting_key = 'resend_domain_id';

-- Update any references in descriptions
UPDATE company_settings
SET description = REPLACE(description, 'Resend', 'MailerSend')
WHERE description LIKE '%Resend%';

-- Add comment to track migration
COMMENT ON COLUMN company_settings.setting_key IS 'Company configuration setting key (migrated from Resend to MailerSend on 2025-11-17)';
