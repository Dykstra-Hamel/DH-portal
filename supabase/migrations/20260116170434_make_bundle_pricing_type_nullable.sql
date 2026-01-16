-- Make pricing_type nullable for bundle_plans
-- This allows per-interval pricing bundles to omit the global pricing_type field
-- since their pricing is defined in the interval_pricing JSONB array

-- Step 1: Set a default value for any existing NULL values (shouldn't be any, but safety first)
UPDATE bundle_plans
SET pricing_type = 'discount'
WHERE pricing_type IS NULL;

-- Step 2: Drop the NOT NULL constraint
ALTER TABLE bundle_plans
ALTER COLUMN pricing_type DROP NOT NULL;

-- Step 3: Drop existing check constraint if it exists, then add it
ALTER TABLE bundle_plans
DROP CONSTRAINT IF EXISTS bundle_plans_pricing_type_check;

ALTER TABLE bundle_plans
ADD CONSTRAINT bundle_plans_pricing_type_check
CHECK (
  pricing_mode = 'per_interval'
  OR pricing_type IS NOT NULL
);

-- Update comment
COMMENT ON COLUMN bundle_plans.pricing_type IS 'Pricing type for global pricing mode (custom or discount). Can be NULL when pricing_mode = per_interval since pricing is defined in interval_pricing array.';
COMMENT ON CONSTRAINT bundle_plans_pricing_type_check ON bundle_plans IS 'Ensures pricing_type is set when using global pricing mode';
