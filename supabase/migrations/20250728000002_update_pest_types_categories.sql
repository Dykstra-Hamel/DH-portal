-- Add new category_id column to pest_types table
ALTER TABLE pest_types ADD COLUMN category_id UUID REFERENCES pest_categories(id) ON DELETE SET NULL;

-- Update existing pest_types to reference the new categories
UPDATE pest_types SET category_id = (
    SELECT id FROM pest_categories 
    WHERE pest_categories.slug = pest_types.category
);

-- Make category_id NOT NULL since we're replacing the old system
ALTER TABLE pest_types ALTER COLUMN category_id SET NOT NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_pest_types_category_id ON pest_types(category_id);

-- Drop the old category column and its constraint
ALTER TABLE pest_types DROP COLUMN category;

-- Drop the old enum type if it exists
DROP TYPE IF EXISTS pest_category_enum;