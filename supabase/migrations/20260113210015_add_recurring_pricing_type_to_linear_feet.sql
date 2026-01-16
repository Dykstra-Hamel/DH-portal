-- Add recurring pricing type option to linear_feet_pricing
-- Supports either per-foot recurring pricing OR flat monthly recurring pricing

-- Update the column comment to document both recurring pricing options
COMMENT ON COLUMN service_plans.linear_feet_pricing IS 'JSON object containing tiered pricing rates per linear foot. Initial pricing is always per-foot. Recurring pricing can be either per-foot or flat monthly. Example per-foot: {"pricing_mode": "tiered", "initial_price_per_foot": [2.00, 2.75], "recurring_pricing_type": "per_foot", "recurring_price_per_foot": [1.50, 2.00]} calculates 250ft @ $2.75/ft initial, $2.00/ft recurring = $500/mo. Example flat: {"pricing_mode": "tiered", "initial_price_per_foot": [2.00], "recurring_pricing_type": "flat", "recurring_flat_price": [33.00]} calculates 250ft @ $2.00/ft initial = $500, then $33/mo recurring regardless of footage.';

-- Update all existing linear_feet_pricing to add recurring_pricing_type and recurring_flat_price fields
-- Default to 'per_foot' for existing data to maintain backwards compatibility
UPDATE service_plans
SET linear_feet_pricing = linear_feet_pricing || jsonb_build_object(
  'recurring_pricing_type', 'per_foot',
  'recurring_flat_price', '[]'::jsonb
)
WHERE linear_feet_pricing IS NOT NULL
  AND NOT (linear_feet_pricing ? 'recurring_pricing_type');

-- For any service plans without linear_feet_pricing, set full default structure
UPDATE service_plans
SET linear_feet_pricing = '{
  "pricing_mode": "tiered",
  "initial_price_per_foot": [2.00],
  "recurring_pricing_type": "per_foot",
  "recurring_price_per_foot": [1.50],
  "recurring_flat_price": []
}'::jsonb
WHERE linear_feet_pricing IS NULL;
