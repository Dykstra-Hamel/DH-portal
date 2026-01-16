-- Clear default linear feet pricing from existing service plans
-- Linear feet pricing should be opt-in per plan, not enabled by default

-- Set linear_feet_pricing to NULL for all existing plans
-- This allows plans to explicitly enable linear feet pricing when needed
UPDATE service_plans
SET linear_feet_pricing = NULL
WHERE linear_feet_pricing IS NOT NULL;

-- Remove the default value from the column
-- New plans will have NULL by default and can opt-in to linear feet pricing
ALTER TABLE service_plans
ALTER COLUMN linear_feet_pricing DROP DEFAULT;

-- Update comment to reflect opt-in behavior
COMMENT ON COLUMN service_plans.linear_feet_pricing IS 'Optional JSON object for linear feet pricing. Set to NULL to disable. When enabled, contains pricing configuration for linear feet calculations. Supports tiered intervals with per-foot rates. Example: {"initial_price_per_foot": [0, 2.75, 2.50], "recurring_pricing_types": ["per_foot", "per_foot", "flat"], "recurring_price_per_foot": [0, 1.50, 0], "recurring_flat_price": [0, 0, 150]}';
