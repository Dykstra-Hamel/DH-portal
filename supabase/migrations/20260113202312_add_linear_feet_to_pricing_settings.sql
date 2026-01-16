-- Add linear feet interval columns to company_pricing_settings table
ALTER TABLE company_pricing_settings
ADD COLUMN IF NOT EXISTS base_linear_feet INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS linear_feet_interval INTEGER NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS max_linear_feet INTEGER NOT NULL DEFAULT 500;

-- Add comments to explain the linear feet interval structure
COMMENT ON COLUMN company_pricing_settings.base_linear_feet IS 'Starting linear feet value for the first interval (default: 100 ft)';
COMMENT ON COLUMN company_pricing_settings.linear_feet_interval IS 'Linear feet increment for each interval step (default: 50 ft)';
COMMENT ON COLUMN company_pricing_settings.max_linear_feet IS 'Maximum linear feet before "max+" option is shown (default: 500 ft)';
