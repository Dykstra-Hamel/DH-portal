-- Create unsubscribe_tokens table for secure unsubscribe link management
-- Tokens are generated when emails are sent and allow one-click unsubscribe

CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  email TEXT,
  phone_number TEXT,
  source VARCHAR(50) NOT NULL DEFAULT 'email_campaign'
    CHECK (source IN ('email_campaign', 'call_campaign', 'sms_campaign', 'manual', 'workflow', 'automation')),
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add constraint to ensure at least one contact method is provided
ALTER TABLE unsubscribe_tokens
ADD CONSTRAINT unsubscribe_contact_required
CHECK (email IS NOT NULL OR phone_number IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_unsubscribe_tokens_token ON unsubscribe_tokens(token);
CREATE INDEX idx_unsubscribe_tokens_company_id ON unsubscribe_tokens(company_id);
CREATE INDEX idx_unsubscribe_tokens_customer_id ON unsubscribe_tokens(customer_id);
CREATE INDEX idx_unsubscribe_tokens_email ON unsubscribe_tokens(LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX idx_unsubscribe_tokens_phone ON unsubscribe_tokens(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX idx_unsubscribe_tokens_expires_at ON unsubscribe_tokens(expires_at);
CREATE INDEX idx_unsubscribe_tokens_used_at ON unsubscribe_tokens(used_at) WHERE used_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can do anything (for backend operations)
CREATE POLICY "Service role full access"
ON unsubscribe_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policy: Users can view tokens for their company (admin use)
CREATE POLICY "Users can view company unsubscribe tokens"
ON unsubscribe_tokens
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM user_companies WHERE user_id = auth.uid()
  )
);

-- Add comments for documentation
COMMENT ON TABLE unsubscribe_tokens IS 'Secure tokens for one-click unsubscribe links in emails and other communications';
COMMENT ON COLUMN unsubscribe_tokens.token IS 'Unique secure token for unsubscribe URL (generated via crypto.randomBytes)';
COMMENT ON COLUMN unsubscribe_tokens.email IS 'Email address associated with this token (nullable if phone-only)';
COMMENT ON COLUMN unsubscribe_tokens.phone_number IS 'Phone number associated with this token (nullable if email-only)';
COMMENT ON COLUMN unsubscribe_tokens.source IS 'Source that generated this token (campaign type or manual)';
COMMENT ON COLUMN unsubscribe_tokens.metadata IS 'Additional context (campaign_id, execution_id, template_id, etc.)';
COMMENT ON COLUMN unsubscribe_tokens.expires_at IS 'Token expiration date (default: 90 days from creation)';
COMMENT ON COLUMN unsubscribe_tokens.used_at IS 'Timestamp when token was used to unsubscribe (null if unused)';

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_unsubscribe_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER unsubscribe_tokens_update_timestamp
BEFORE UPDATE ON unsubscribe_tokens
FOR EACH ROW
EXECUTE FUNCTION update_unsubscribe_tokens_updated_at();
