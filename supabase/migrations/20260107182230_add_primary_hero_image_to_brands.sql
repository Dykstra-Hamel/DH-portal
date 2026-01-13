-- Add primary hero image field to brands table for use in quotes, campaigns, etc.
ALTER TABLE brands ADD COLUMN primary_hero_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN brands.primary_hero_image_url IS 'Primary hero image used across the platform (quote pages, campaigns, landing pages, etc.). This is the default hero image for the brand.';
