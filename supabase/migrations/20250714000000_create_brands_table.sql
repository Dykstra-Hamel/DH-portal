-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Brand Guidelines Content
    brand_guidelines TEXT,
    brand_strategy TEXT,
    personality TEXT,
    
    -- Logo
    logo_url TEXT,
    logo_description TEXT,
    
    -- Colors
    primary_color_hex VARCHAR(7),
    primary_color_cmyk VARCHAR(50),
    primary_color_pantone VARCHAR(50),
    
    secondary_color_hex VARCHAR(7),
    secondary_color_cmyk VARCHAR(50),
    secondary_color_pantone VARCHAR(50),
    
    -- Alternative colors (array of color objects with hex, cmyk, pantone)
    alternative_colors JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{"hex": "#FF0000", "cmyk": "0,100,100,0", "pantone": "186 C", "name": "Red"}, ...]
    
    -- Typography (up to 3 fonts)
    font_primary_name VARCHAR(100),
    font_primary_example TEXT,
    font_primary_url TEXT,
    
    font_secondary_name VARCHAR(100),
    font_secondary_example TEXT,
    font_secondary_url TEXT,
    
    font_tertiary_name VARCHAR(100),
    font_tertiary_example TEXT,
    font_tertiary_url TEXT,
    
    -- Photography/Art Direction
    photography_description TEXT,
    photography_images JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_brands_company_id ON brands(company_id);
CREATE INDEX IF NOT EXISTS idx_brands_created_at ON brands(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Create policies
-- All authenticated users can view brands
CREATE POLICY "Allow authenticated users to view brands" ON brands
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can insert brands
CREATE POLICY "Allow admin users to insert brands" ON brands
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Only admins can update brands
CREATE POLICY "Allow admin users to update brands" ON brands
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Only admins can delete brands
CREATE POLICY "Allow admin users to delete brands" ON brands
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Ensure one-to-one relationship between companies and brands
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_company_id_unique ON brands(company_id);