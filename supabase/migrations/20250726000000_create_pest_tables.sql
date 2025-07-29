-- Create pest_types table for master pest definitions
CREATE TABLE IF NOT EXISTS pest_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('general', 'rodents', 'wood_destroying_insects', 'other')) NOT NULL,
    icon_url TEXT, -- Store pest icon/emoji URLs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_pest_options table for company-specific pest configurations
CREATE TABLE IF NOT EXISTS company_pest_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    pest_id UUID REFERENCES pest_types(id) ON DELETE CASCADE NOT NULL,
    custom_label TEXT, -- Override default pest name if needed
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, pest_id) -- Prevent duplicates
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pest_types_category ON pest_types(category);
CREATE INDEX IF NOT EXISTS idx_pest_types_slug ON pest_types(slug);
CREATE INDEX IF NOT EXISTS idx_pest_types_active ON pest_types(is_active);

CREATE INDEX IF NOT EXISTS idx_company_pest_options_company_id ON company_pest_options(company_id);
CREATE INDEX IF NOT EXISTS idx_company_pest_options_pest_id ON company_pest_options(pest_id);
CREATE INDEX IF NOT EXISTS idx_company_pest_options_display_order ON company_pest_options(company_id, display_order);
CREATE INDEX IF NOT EXISTS idx_company_pest_options_active ON company_pest_options(company_id, is_active);

-- Create updated_at trigger for pest_types
CREATE TRIGGER update_pest_types_updated_at
    BEFORE UPDATE ON pest_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE pest_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_pest_options ENABLE ROW LEVEL SECURITY;

-- Create policies for pest_types (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to view pest types" ON pest_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage pest types" ON pest_types
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create policies for company_pest_options
CREATE POLICY "Allow users to view their company pest options" ON company_pest_options
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (
            -- Users can see their own company's pest options
            EXISTS (
                SELECT 1 FROM user_companies 
                WHERE user_companies.user_id = auth.uid() 
                AND user_companies.company_id = company_pest_options.company_id
            )
            OR
            -- Admins can see all
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        )
    );

CREATE POLICY "Allow users to manage their company pest options" ON company_pest_options
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (
            -- Users can manage their own company's pest options
            EXISTS (
                SELECT 1 FROM user_companies 
                WHERE user_companies.user_id = auth.uid() 
                AND user_companies.company_id = company_pest_options.company_id
            )
            OR
            -- Admins can manage all
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
            )
        )
    );

-- Insert default pest types
INSERT INTO pest_types (name, slug, description, category, icon_url) VALUES
    ('Ants', 'ants', 'Common household ants including odorous house ants, sugar ants, and carpenter ants', 'general', '🐜'),
    ('Spiders', 'spiders', 'House spiders, black widows, brown recluse, and other arachnids', 'general', '🕷️'),
    ('Cockroaches', 'cockroaches', 'German cockroaches, American cockroaches, and other roach species', 'general', '🪳'),
    ('Wasps', 'wasps', 'Paper wasps, yellow jackets, hornets, and other stinging insects', 'general', '🐝'),
    ('Rodents (mice & rats)', 'rodents', 'House mice, Norway rats, roof rats, and other rodent pests', 'rodents', '🐭'),
    ('Termites', 'termites', 'Subterranean termites, drywood termites, and other wood-destroying insects', 'wood_destroying_insects', '🐛'),
    ('Others (earwigs, boxelders, etc.)', 'others', 'Earwigs, boxelder bugs, silverfish, and other miscellaneous pests', 'other', '🦗');

-- Add default pest options for all existing companies
INSERT INTO company_pest_options (company_id, pest_id, display_order)
SELECT 
    companies.id as company_id,
    pest_types.id as pest_id,
    ROW_NUMBER() OVER (PARTITION BY companies.id ORDER BY 
        CASE pest_types.slug
            WHEN 'ants' THEN 1
            WHEN 'spiders' THEN 2
            WHEN 'cockroaches' THEN 3
            WHEN 'rodents' THEN 4
            WHEN 'termites' THEN 5
            WHEN 'wasps' THEN 6
            WHEN 'others' THEN 7
            ELSE 99
        END
    ) as display_order
FROM companies
CROSS JOIN pest_types
WHERE pest_types.is_active = true
ON CONFLICT (company_id, pest_id) DO NOTHING;