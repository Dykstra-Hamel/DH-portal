-- Add discount pricing options to bundle_plans to match company_discounts pattern
-- Allows bundles to apply discounts to initial price, recurring price, or both

ALTER TABLE bundle_plans
  -- Add field to specify which price(s) the discount applies to
  ADD COLUMN applies_to_price TEXT CHECK (applies_to_price IN ('initial', 'recurring', 'both')) DEFAULT 'both',

  -- Separate recurring discount settings (used when applies_to_price = 'both')
  ADD COLUMN recurring_discount_type TEXT CHECK (recurring_discount_type IN ('percentage', 'fixed')),
  ADD COLUMN recurring_discount_value DECIMAL(10,2);

-- Update existing records to use 'both' for consistency
UPDATE bundle_plans
SET applies_to_price = 'both'
WHERE pricing_type = 'discount' AND applies_to_price IS NULL;

COMMENT ON COLUMN bundle_plans.applies_to_price IS 'Which price the discount applies to: initial, recurring, or both';
COMMENT ON COLUMN bundle_plans.recurring_discount_type IS 'Discount type for recurring price when applies_to_price = both';
COMMENT ON COLUMN bundle_plans.recurring_discount_value IS 'Discount value for recurring price when applies_to_price = both';
