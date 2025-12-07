-- Add icon logo fields to brands table
ALTER TABLE brands
ADD COLUMN icon_logo_url TEXT,
ADD COLUMN icon_logo_description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN brands.icon_logo_url IS 'URL to the small icon version of the company logo (recommended: 64x64px or smaller)';
COMMENT ON COLUMN brands.icon_logo_description IS 'Description of the icon logo usage and purpose';