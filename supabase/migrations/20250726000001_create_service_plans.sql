-- Create service_plans table
CREATE TABLE IF NOT EXISTS service_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    
    -- Core Plan Info
    plan_name TEXT NOT NULL,
    plan_description TEXT,
    plan_category TEXT, -- 'basic', 'standard', 'premium'
    
    -- Pricing
    initial_price DECIMAL(10,2),
    recurring_price DECIMAL(10,2) NOT NULL,
    billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'semi-annually', 'annually')) NOT NULL,
    
    -- Service Details
    treatment_frequency TEXT, -- 'monthly', 'bi-monthly', 'quarterly'
    includes_inspection BOOLEAN DEFAULT false,
    
    -- Content
    plan_features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings
    plan_faqs JSONB DEFAULT '[]'::jsonb, -- Array of {question, answer} objects
    
    -- Display Control
    display_order INTEGER DEFAULT 0,
    highlight_badge TEXT, -- 'Most Popular', 'Best Value'
    color_scheme JSONB, -- {primary: '#color', secondary: '#color'}
    requires_quote BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plan_pest_coverage junction table
CREATE TABLE IF NOT EXISTS plan_pest_coverage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID REFERENCES service_plans(id) ON DELETE CASCADE NOT NULL,
    pest_id UUID REFERENCES pest_types(id) ON DELETE CASCADE NOT NULL,
    coverage_level TEXT CHECK (coverage_level IN ('full', 'partial', 'prevention')) DEFAULT 'full',
    UNIQUE(plan_id, pest_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_service_plans_company_id ON service_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_active ON service_plans(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_service_plans_display_order ON service_plans(company_id, display_order);

CREATE INDEX IF NOT EXISTS idx_plan_pest_coverage_plan_id ON plan_pest_coverage(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_pest_coverage_pest_id ON plan_pest_coverage(pest_id);
CREATE INDEX IF NOT EXISTS idx_plan_pest_coverage_lookup ON plan_pest_coverage(pest_id, plan_id);

-- Create updated_at trigger for service_plans
CREATE TRIGGER update_service_plans_updated_at
    BEFORE UPDATE ON service_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_pest_coverage ENABLE ROW LEVEL SECURITY;

-- Create policies for service_plans
CREATE POLICY "Allow users to view their company service plans" ON service_plans
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (
            -- Users can see their own company's plans
            EXISTS (
                SELECT 1 FROM user_companies 
                WHERE user_companies.user_id = auth.uid() 
                AND user_companies.company_id = service_plans.company_id
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

CREATE POLICY "Allow users to manage their company service plans" ON service_plans
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (
            -- Users can manage their own company's plans
            EXISTS (
                SELECT 1 FROM user_companies 
                WHERE user_companies.user_id = auth.uid() 
                AND user_companies.company_id = service_plans.company_id
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

-- Create policies for plan_pest_coverage
CREATE POLICY "Allow users to view their company plan pest coverage" ON plan_pest_coverage
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (
            -- Users can see coverage for their own company's plans
            EXISTS (
                SELECT 1 FROM service_plans 
                JOIN user_companies ON user_companies.company_id = service_plans.company_id
                WHERE service_plans.id = plan_pest_coverage.plan_id
                AND user_companies.user_id = auth.uid()
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

CREATE POLICY "Allow users to manage their company plan pest coverage" ON plan_pest_coverage
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (
            -- Users can manage coverage for their own company's plans
            EXISTS (
                SELECT 1 FROM service_plans 
                JOIN user_companies ON user_companies.company_id = service_plans.company_id
                WHERE service_plans.id = plan_pest_coverage.plan_id
                AND user_companies.user_id = auth.uid()
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

-- Insert example service plans for existing companies
INSERT INTO service_plans (company_id, plan_name, plan_description, plan_category, initial_price, recurring_price, billing_frequency, treatment_frequency, includes_inspection, plan_features, plan_faqs, display_order, highlight_badge)
SELECT 
    companies.id as company_id,
    'Basic Protection Plan' as plan_name,
    'Essential pest control coverage for common household pests' as plan_description,
    'basic' as plan_category,
    99.00 as initial_price,
    49.99 as recurring_price,
    'quarterly' as billing_frequency,
    'quarterly' as treatment_frequency,
    true as includes_inspection,
    '["Covers 15+ common pests", "Quarterly treatments", "Initial inspection included", "30-day satisfaction guarantee"]'::jsonb as plan_features,
    '[{"question": "What pests are covered?", "answer": "This plan covers ants, spiders, cockroaches, and other common household pests."}, {"question": "How often do you treat?", "answer": "We provide quarterly treatments, which is sufficient for most common pest issues."}]'::jsonb as plan_faqs,
    1 as display_order,
    null as highlight_badge
FROM companies
ON CONFLICT DO NOTHING;

INSERT INTO service_plans (company_id, plan_name, plan_description, plan_category, initial_price, recurring_price, billing_frequency, treatment_frequency, includes_inspection, plan_features, plan_faqs, display_order, highlight_badge)
SELECT 
    companies.id as company_id,
    'Complete Protection Plan' as plan_name,
    'Comprehensive year-round protection against all pest types' as plan_description,
    'premium' as plan_category,
    149.00 as initial_price,
    79.99 as recurring_price,
    'monthly' as billing_frequency,
    'monthly' as treatment_frequency,
    true as includes_inspection,
    '["Covers 25+ pest types", "Monthly treatments", "Spider web sweeping", "Wasp nest removal", "Rodent control", "Satisfaction guaranteed", "Priority scheduling"]'::jsonb as plan_features,
    '[{"question": "What makes this plan different?", "answer": "Our Complete plan includes monthly treatments, covers more pest types, and includes specialized services like wasp nest removal and rodent control."}, {"question": "Is there a guarantee?", "answer": "Yes, we guarantee your satisfaction. If pests return between treatments, we will re-treat at no additional cost."}]'::jsonb as plan_faqs,
    2 as display_order,
    'Most Popular' as highlight_badge
FROM companies
ON CONFLICT DO NOTHING;

-- Add pest coverage for the example plans
-- Basic plan covers general pests only
INSERT INTO plan_pest_coverage (plan_id, pest_id, coverage_level)
SELECT 
    service_plans.id as plan_id,
    pest_types.id as pest_id,
    'full' as coverage_level
FROM service_plans
JOIN companies ON companies.id = service_plans.company_id
CROSS JOIN pest_types
WHERE service_plans.plan_name = 'Basic Protection Plan'
AND pest_types.category IN ('general')
AND pest_types.slug NOT IN ('wasps') -- Exclude wasps from basic plan
ON CONFLICT DO NOTHING;

-- Complete plan covers all pest types
INSERT INTO plan_pest_coverage (plan_id, pest_id, coverage_level)
SELECT 
    service_plans.id as plan_id,
    pest_types.id as pest_id,
    'full' as coverage_level
FROM service_plans
JOIN companies ON companies.id = service_plans.company_id
CROSS JOIN pest_types
WHERE service_plans.plan_name = 'Complete Protection Plan'
AND pest_types.is_active = true
ON CONFLICT DO NOTHING;