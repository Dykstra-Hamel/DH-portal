-- Add alternate logos column to brands table
ALTER TABLE brands
ADD COLUMN alternate_logos JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN brands.alternate_logos IS 'Additional logos with custom names/labels - array of objects with name, url, and description';
