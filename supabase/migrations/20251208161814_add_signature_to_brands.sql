-- Add signature_url field to brands table
ALTER TABLE brands
ADD COLUMN signature_url TEXT;

-- Add signature_description field for context
ALTER TABLE brands
ADD COLUMN signature_description TEXT;
