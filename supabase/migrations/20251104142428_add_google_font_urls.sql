-- Add Google Font URL columns to brands table
ALTER TABLE brands
ADD COLUMN font_primary_google_url TEXT,
ADD COLUMN font_secondary_google_url TEXT,
ADD COLUMN font_tertiary_google_url TEXT;

COMMENT ON COLUMN brands.font_primary_google_url IS 'Google Fonts page URL for primary font (e.g., https://fonts.google.com/specimen/Roboto)';
COMMENT ON COLUMN brands.font_secondary_google_url IS 'Google Fonts page URL for secondary font';
COMMENT ON COLUMN brands.font_tertiary_google_url IS 'Google Fonts page URL for tertiary font';
