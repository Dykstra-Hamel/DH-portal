-- Add AWS SES fields to company_settings table for tenant management
-- This migration adds fields needed to track AWS SES tenant configuration per company

-- Add AWS SES tenant fields
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS aws_ses_tenant_id TEXT,
ADD COLUMN IF NOT EXISTS aws_ses_tenant_name TEXT,
ADD COLUMN IF NOT EXISTS aws_ses_tenant_arn TEXT,
ADD COLUMN IF NOT EXISTS aws_ses_identity_arn TEXT,
ADD COLUMN IF NOT EXISTS aws_ses_configuration_set TEXT,
ADD COLUMN IF NOT EXISTS aws_ses_dkim_tokens JSONB;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_settings_aws_ses_tenant_name
ON company_settings(aws_ses_tenant_name);

CREATE INDEX IF NOT EXISTS idx_company_settings_aws_ses_tenant_id
ON company_settings(aws_ses_tenant_id);

-- Add comment for documentation
COMMENT ON COLUMN company_settings.aws_ses_tenant_id IS 'AWS SES tenant unique identifier';
COMMENT ON COLUMN company_settings.aws_ses_tenant_name IS 'AWS SES tenant name (company-{uuid})';
COMMENT ON COLUMN company_settings.aws_ses_tenant_arn IS 'AWS SES tenant Amazon Resource Name';
COMMENT ON COLUMN company_settings.aws_ses_identity_arn IS 'AWS SES verified email identity ARN for company domain';
COMMENT ON COLUMN company_settings.aws_ses_configuration_set IS 'AWS SES configuration set name for event tracking';
COMMENT ON COLUMN company_settings.aws_ses_dkim_tokens IS 'Array of DKIM CNAME tokens for DNS verification [{"name": "...", "value": "..."}]';
