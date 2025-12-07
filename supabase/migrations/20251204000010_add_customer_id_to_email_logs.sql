-- Add customer_id column to email_logs for lead tracking from email clicks
-- This enables the createLeadLink functionality to work properly

-- Add customer_id column
ALTER TABLE email_logs
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Add index for customer lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_customer_id
ON email_logs(customer_id);

-- Add composite index for lead duplicate checking (performance optimization)
CREATE INDEX IF NOT EXISTS idx_leads_customer_company_campaign
ON leads(customer_id, company_id, campaign_id)
WHERE campaign_id IS NOT NULL;

-- Add column comment
COMMENT ON COLUMN email_logs.customer_id IS 'Customer who received this email (enables lead tracking from email clicks)';
