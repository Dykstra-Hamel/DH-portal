-- Create monthly service budgets system for tracking ad spend
-- Allows tracking multiple budget types (Google Ads, Social Media, LSA) per service per month

-- Add budget tracking configuration to monthly_services
ALTER TABLE monthly_services
ADD COLUMN IF NOT EXISTS track_google_ads_budget BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_google_ads_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS track_social_media_budget BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_social_media_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS track_lsa_budget BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_lsa_budget DECIMAL(10,2);

-- Create monthly_service_budgets table for month-specific budget tracking
CREATE TABLE IF NOT EXISTS monthly_service_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monthly_service_id UUID NOT NULL REFERENCES monthly_services(id) ON DELETE CASCADE,

    -- Budget type (google_ads, social_media, lsa, etc.)
    budget_type TEXT NOT NULL CHECK (budget_type IN ('google_ads', 'social_media', 'lsa')),

    -- Month tracking
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),

    -- Budget amounts
    budgeted_amount DECIMAL(10,2) NOT NULL CHECK (budgeted_amount >= 0),
    actual_spend DECIMAL(10,2) CHECK (actual_spend >= 0),

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Ensure unique budget per type per month per service
    CONSTRAINT unique_budget_per_month UNIQUE(monthly_service_id, budget_type, year, month)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monthly_service_budgets_service_id
    ON monthly_service_budgets(monthly_service_id);

CREATE INDEX IF NOT EXISTS idx_monthly_service_budgets_year_month
    ON monthly_service_budgets(year, month);

CREATE INDEX IF NOT EXISTS idx_monthly_service_budgets_service_year_month
    ON monthly_service_budgets(monthly_service_id, year, month);

CREATE INDEX IF NOT EXISTS idx_monthly_service_budgets_type
    ON monthly_service_budgets(budget_type);

-- Create trigger for updated_at
CREATE TRIGGER update_monthly_service_budgets_updated_at
    BEFORE UPDATE ON monthly_service_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE monthly_service_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view budgets
CREATE POLICY "Admins can view monthly service budgets"
    ON monthly_service_budgets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- RLS Policy: Only admins can manage budgets
CREATE POLICY "Admins can manage monthly service budgets"
    ON monthly_service_budgets
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_budgets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_service_budgets TO service_role;

-- Add helpful comments
COMMENT ON TABLE monthly_service_budgets IS 'Monthly budget tracking for ad spend across different platforms (Google Ads, Social Media, LSA)';
COMMENT ON COLUMN monthly_service_budgets.budget_type IS 'Type of ad budget: google_ads, social_media, or lsa';
COMMENT ON COLUMN monthly_service_budgets.budgeted_amount IS 'Planned budget amount for the month';
COMMENT ON COLUMN monthly_service_budgets.actual_spend IS 'Actual amount spent (recorded at month end)';
COMMENT ON COLUMN monthly_services.track_google_ads_budget IS 'Enable Google Ads budget tracking for this service';
COMMENT ON COLUMN monthly_services.default_google_ads_budget IS 'Default monthly Google Ads budget amount';
COMMENT ON COLUMN monthly_services.track_social_media_budget IS 'Enable Social Media budget tracking for this service';
COMMENT ON COLUMN monthly_services.default_social_media_budget IS 'Default monthly Social Media budget amount';
COMMENT ON COLUMN monthly_services.track_lsa_budget IS 'Enable LSA budget tracking for this service';
COMMENT ON COLUMN monthly_services.default_lsa_budget IS 'Default monthly LSA budget amount';
