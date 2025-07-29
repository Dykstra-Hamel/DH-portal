-- Create pest_categories table for dynamic category management
CREATE TABLE IF NOT EXISTS pest_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pest_categories_slug ON pest_categories(slug);
CREATE INDEX IF NOT EXISTS idx_pest_categories_active ON pest_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_pest_categories_display_order ON pest_categories(display_order);

-- Create updated_at trigger for pest_categories
CREATE TRIGGER update_pest_categories_updated_at
    BEFORE UPDATE ON pest_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE pest_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for pest_categories (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to view pest categories" ON pest_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage pest categories" ON pest_categories
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert default pest categories (matching existing enum values)
INSERT INTO pest_categories (name, slug, description, display_order) VALUES
    ('General', 'general', 'Common household pests and insects', 1),
    ('Rodents', 'rodents', 'Mice, rats, and other rodent pests', 2),
    ('Wood Destroying Insects', 'wood_destroying_insects', 'Termites and other wood-destroying pests', 3),
    ('Other', 'other', 'Miscellaneous and specialized pest types', 4);