-- Add font_color_hex column to brands table
-- Used as the base text color on campaign landing pages
ALTER TABLE brands
ADD COLUMN font_color_hex VARCHAR(7);

COMMENT ON COLUMN brands.font_color_hex IS 'Brand font/text color hex code. Falls back to #2b2b2b when not set.';
