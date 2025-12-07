-- Create or update email_logs table for AWS SES tracking
-- This migration ensures email_logs table exists with all necessary fields for SES event tracking

-- Create delivery_status enum for tracking email delivery lifecycle
DO $$ BEGIN
  CREATE TYPE email_delivery_status AS ENUM (
    'sent',
    'delivered',
    'bounced',
    'complained',
    'opened',
    'clicked',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create email_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  template_id UUID,
  recipient_email TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  email_provider TEXT NOT NULL DEFAULT 'mailersend',
  provider_message_id TEXT,
  send_status TEXT NOT NULL DEFAULT 'sent',
  source TEXT DEFAULT 'automation_workflow',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add new SES-specific fields
ALTER TABLE email_logs
ADD COLUMN IF NOT EXISTS ses_message_id TEXT,
ADD COLUMN IF NOT EXISTS tenant_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_status email_delivery_status DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS bounce_type TEXT,
ADD COLUMN IF NOT EXISTS bounce_subtype TEXT,
ADD COLUMN IF NOT EXISTS complaint_feedback_type TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ses_event_data JSONB;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_logs_company_id
ON email_logs(company_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id
ON email_logs(lead_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email
ON email_logs(LOWER(recipient_email));

CREATE INDEX IF NOT EXISTS idx_email_logs_ses_message_id
ON email_logs(ses_message_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_tenant_name
ON email_logs(tenant_name);

CREATE INDEX IF NOT EXISTS idx_email_logs_delivery_status
ON email_logs(delivery_status);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at
ON email_logs(sent_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view email logs for their company
CREATE POLICY "Users can view company email logs"
ON email_logs
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
);

-- Policy: System can insert email logs (service role bypass)
CREATE POLICY "Service role can insert email logs"
ON email_logs
FOR INSERT
WITH CHECK (true);

-- Policy: System can update email logs for event tracking (service role bypass)
CREATE POLICY "Service role can update email logs"
ON email_logs
FOR UPDATE
USING (true);

-- Add comments for documentation
COMMENT ON TABLE email_logs IS 'Tracks all sent emails and their delivery status via AWS SES events';
COMMENT ON COLUMN email_logs.ses_message_id IS 'AWS SES unique message identifier';
COMMENT ON COLUMN email_logs.tenant_name IS 'AWS SES tenant that sent the email';
COMMENT ON COLUMN email_logs.delivery_status IS 'Current delivery status: sent, delivered, bounced, complained, opened, clicked, or failed';
COMMENT ON COLUMN email_logs.bounce_type IS 'AWS SES bounce type: Undetermined, Permanent, Transient, or Complaint';
COMMENT ON COLUMN email_logs.bounce_subtype IS 'AWS SES bounce subtype: General, NoEmail, Suppressed, OnAccountSuppressionList, etc.';
COMMENT ON COLUMN email_logs.complaint_feedback_type IS 'Complaint type: abuse, auth-failure, fraud, not-spam, other, virus';
COMMENT ON COLUMN email_logs.ses_event_data IS 'Complete AWS SES event payload (JSON) for audit trail';

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS email_logs_update_timestamp ON email_logs;
CREATE TRIGGER email_logs_update_timestamp
BEFORE UPDATE ON email_logs
FOR EACH ROW
EXECUTE FUNCTION update_email_logs_updated_at();
