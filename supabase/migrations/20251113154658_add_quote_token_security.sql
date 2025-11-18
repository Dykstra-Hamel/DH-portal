-- Add token-based security to quotes table
-- Allows secure public access to quotes without authentication

ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS quote_token UUID UNIQUE DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;

-- Make quote_token NOT NULL (will use default for new rows)
ALTER TABLE quotes
ALTER COLUMN quote_token SET NOT NULL;

-- Create index for fast token lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_quote_token ON quotes(quote_token);

-- Add comments for documentation
COMMENT ON COLUMN quotes.quote_token IS 'Secure UUID token for public access to quote. Must be included in URL for viewing/updating.';
COMMENT ON COLUMN quotes.token_expires_at IS 'Optional expiry timestamp for token. NULL means token never expires.';
