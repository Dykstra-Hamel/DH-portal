-- Add customer_comments column to quotes table
ALTER TABLE quotes
ADD COLUMN customer_comments TEXT;

COMMENT ON COLUMN quotes.customer_comments IS 'Customer comments about contact information or other concerns';
