-- Add widget_config JSON column to companies table
ALTER TABLE companies ADD COLUMN widget_config JSONB DEFAULT '{}'::jsonb;

-- Create index for widget_config queries
CREATE INDEX IF NOT EXISTS idx_companies_widget_config ON companies USING gin(widget_config);

-- Add comment to explain the column
COMMENT ON COLUMN companies.widget_config IS 'Widget configuration including AI knowledge base, branding, and service areas';
