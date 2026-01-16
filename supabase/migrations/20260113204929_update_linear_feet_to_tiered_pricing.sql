-- Update linear_feet_pricing structure from interval-based to tiered per-foot pricing
-- This migration converts existing linear feet pricing data to the new tiered structure

-- Update the column comment to reflect the new structure
COMMENT ON COLUMN service_plans.linear_feet_pricing IS 'JSON object containing tiered pricing rates per linear foot. Arrays contain price per foot for each interval. Example: {"pricing_mode": "tiered", "initial_price_per_foot": [2.00, 2.75, 3.50], "recurring_price_per_foot": [1.50, 2.00, 2.50]} means 0-199ft @ $2/ft initial, 200-299ft @ $2.75/ft, 300+ft @ $3.50/ft. Total price = linear_feet × rate_for_interval.';

-- Update all existing service plans to use the new tiered structure
-- Convert old interval-based pricing to new per-foot arrays with default values
UPDATE service_plans
SET linear_feet_pricing = jsonb_build_object(
  'pricing_mode', 'tiered',
  'initial_price_per_foot', ARRAY[2.00]::numeric[],
  'recurring_price_per_foot', ARRAY[1.50]::numeric[]
)
WHERE linear_feet_pricing IS NOT NULL
  AND linear_feet_pricing ? 'initial_cost_per_interval';

-- For any service plans that don't have linear_feet_pricing yet, set default
UPDATE service_plans
SET linear_feet_pricing = '{
  "pricing_mode": "tiered",
  "initial_price_per_foot": [2.00],
  "recurring_price_per_foot": [1.50]
}'::jsonb
WHERE linear_feet_pricing IS NULL;
