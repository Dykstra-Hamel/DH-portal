-- Create company_pricing_settings table
CREATE TABLE IF NOT EXISTS company_pricing_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,

    -- Home Size Intervals (no pricing, just interval configuration)
    base_home_sq_ft INTEGER NOT NULL DEFAULT 1500,
    home_sq_ft_interval INTEGER NOT NULL DEFAULT 500,
    max_home_sq_ft INTEGER NOT NULL DEFAULT 5000,

    -- Yard Size Intervals (no pricing, just interval configuration)
    base_yard_acres DECIMAL(10,3) NOT NULL DEFAULT 0.25,
    yard_acres_interval DECIMAL(10,3) NOT NULL DEFAULT 0.25,
    max_yard_acres DECIMAL(10,3) NOT NULL DEFAULT 2.0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_company_pricing_settings_company_id ON company_pricing_settings(company_id);

-- Create updated_at trigger
CREATE TRIGGER update_company_pricing_settings_updated_at
    BEFORE UPDATE ON company_pricing_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE company_pricing_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for company_pricing_settings
CREATE POLICY "Allow users to view their company pricing settings" ON company_pricing_settings
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        (
            -- Users can see their own company's settings
            EXISTS (
                SELECT 1 FROM user_companies
                WHERE user_companies.user_id = auth.uid()
                AND user_companies.company_id = company_pricing_settings.company_id
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

CREATE POLICY "Allow users to manage their company pricing settings" ON company_pricing_settings
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        (
            -- Users can manage their own company's settings
            EXISTS (
                SELECT 1 FROM user_companies
                WHERE user_companies.user_id = auth.uid()
                AND user_companies.company_id = company_pricing_settings.company_id
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

-- Seed default pricing settings for all existing companies
INSERT INTO company_pricing_settings (company_id)
SELECT id FROM companies
ON CONFLICT (company_id) DO NOTHING;