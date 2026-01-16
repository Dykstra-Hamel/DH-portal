-- Add interval-based pricing to bundle_plans
-- Allows each size interval to have either custom pricing or a discount strategy

ALTER TABLE bundle_plans
  -- Add pricing mode to distinguish between global pricing (current) and per-interval pricing
  ADD COLUMN pricing_mode TEXT CHECK (pricing_mode IN ('global', 'per_interval')) DEFAULT 'global',

  -- Add JSONB array for interval-specific pricing configurations
  ADD COLUMN interval_pricing JSONB DEFAULT '[]'::jsonb;
  -- Structure: Array of {
  --   interval_index: number (0-based),
  --   pricing_type: 'custom' | 'discount',
  --   custom_initial_price?: number,
  --   custom_recurring_price?: number,
  --   discount_type?: 'percentage' | 'fixed',
  --   discount_value?: number,
  --   recurring_discount_type?: 'percentage' | 'fixed',
  --   recurring_discount_value?: number
  -- }

-- Update existing bundles to use 'global' pricing mode explicitly
UPDATE bundle_plans
SET pricing_mode = 'global'
WHERE pricing_mode IS NULL;

-- Add comments
COMMENT ON COLUMN bundle_plans.pricing_mode IS 'Pricing mode: global (single price/discount for all intervals) or per_interval (different pricing per size interval)';
COMMENT ON COLUMN bundle_plans.interval_pricing IS 'Array of pricing configurations for each size interval when pricing_mode = per_interval';
