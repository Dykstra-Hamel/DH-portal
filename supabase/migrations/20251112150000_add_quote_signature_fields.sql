-- Add signature and tracking fields to quotes table

-- Add new columns
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS quote_url TEXT,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signature_data TEXT,
ADD COLUMN IF NOT EXISTS device_data JSONB;

-- Update the quote_status constraint to include 'completed'
ALTER TABLE quotes
DROP CONSTRAINT IF EXISTS check_quote_status;

ALTER TABLE quotes
ADD CONSTRAINT check_quote_status CHECK (
    quote_status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'completed')
);

-- Add index for quote_url for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotes_quote_url ON quotes(quote_url);

-- Add index for signed_at for reporting
CREATE INDEX IF NOT EXISTS idx_quotes_signed_at ON quotes(signed_at);

-- Add comments for documentation
COMMENT ON COLUMN quotes.quote_url IS 'Public URL where customer can view and accept the quote';
COMMENT ON COLUMN quotes.signed_at IS 'Timestamp when customer signed the quote';
COMMENT ON COLUMN quotes.signature_data IS 'Base64 encoded signature image data';
COMMENT ON COLUMN quotes.device_data IS 'JSONB containing IP, device info, browser, timezone, etc. captured at signing';

-- Update RLS policy to allow public read access for quotes with a valid quote_url
-- This allows customers to view their quotes without authentication
CREATE POLICY "Public can view quotes with valid URL"
    ON quotes FOR SELECT
    USING (quote_url IS NOT NULL);
