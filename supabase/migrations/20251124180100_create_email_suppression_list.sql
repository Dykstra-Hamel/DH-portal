-- Create email_suppression_list table for tracking bounced and complained email addresses
-- This prevents sending to problematic addresses and maintains email sender reputation

-- Create enum types for suppression reasons and types
CREATE TYPE suppression_reason AS ENUM ('bounce', 'complaint', 'manual');
CREATE TYPE suppression_type AS ENUM ('hard_bounce', 'soft_bounce', 'complaint', 'unsubscribe');

-- Create email_suppression_list table
CREATE TABLE IF NOT EXISTS email_suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  suppression_reason suppression_reason NOT NULL,
  suppression_type suppression_type NOT NULL,
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ses_event_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index to prevent duplicate suppression entries per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_suppression_company_email
ON email_suppression_list(company_id, LOWER(email_address));

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_email_suppression_email
ON email_suppression_list(LOWER(email_address));

-- Create index for company_id lookups
CREATE INDEX IF NOT EXISTS idx_email_suppression_company_id
ON email_suppression_list(company_id);

-- Create index for suppression_reason
CREATE INDEX IF NOT EXISTS idx_email_suppression_reason
ON email_suppression_list(suppression_reason);

-- Add RLS (Row Level Security) policies
ALTER TABLE email_suppression_list ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view suppression list for their company
CREATE POLICY "Users can view company suppression list"
ON email_suppression_list
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
);

-- Policy: Users can add to suppression list for their company
CREATE POLICY "Users can add to company suppression list"
ON email_suppression_list
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
);

-- Policy: Users can remove from suppression list for their company
CREATE POLICY "Users can remove from company suppression list"
ON email_suppression_list
FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
);

-- Add comments for documentation
COMMENT ON TABLE email_suppression_list IS 'Tracks email addresses that should not receive emails due to bounces, complaints, or manual suppression';
COMMENT ON COLUMN email_suppression_list.email_address IS 'Email address to suppress (stored in original case, indexed as lowercase)';
COMMENT ON COLUMN email_suppression_list.suppression_reason IS 'Why this email was suppressed: bounce, complaint, or manual';
COMMENT ON COLUMN email_suppression_list.suppression_type IS 'Specific type: hard_bounce, soft_bounce, complaint, or unsubscribe';
COMMENT ON COLUMN email_suppression_list.ses_event_data IS 'Original AWS SES event data (JSON) for audit trail';
COMMENT ON COLUMN email_suppression_list.notes IS 'Optional notes about why this email was suppressed';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_email_suppression_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER email_suppression_update_timestamp
BEFORE UPDATE ON email_suppression_list
FOR EACH ROW
EXECUTE FUNCTION update_email_suppression_updated_at();
