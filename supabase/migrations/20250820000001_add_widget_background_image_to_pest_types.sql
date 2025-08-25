-- Add widget_background_image column to pest_types table
ALTER TABLE pest_types ADD COLUMN widget_background_image TEXT;

-- Create index for the new widget_background_image column
CREATE INDEX IF NOT EXISTS idx_pest_types_widget_background_image ON pest_types(widget_background_image);

-- Add comment to explain the column usage
COMMENT ON COLUMN pest_types.widget_background_image IS 'URL to background image displayed in widget for this pest type';