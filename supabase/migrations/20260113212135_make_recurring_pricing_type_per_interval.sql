-- Convert recurring_pricing_type from a single value to an array (one per interval)
-- This allows each interval to independently use either per-foot or flat pricing

-- Update the column comment to document per-interval recurring types
COMMENT ON COLUMN service_plans.linear_feet_pricing IS 'JSON object containing tiered pricing rates per linear foot. Initial pricing is always per-foot. Recurring pricing type can vary per interval. Example: {"pricing_mode": "tiered", "initial_price_per_foot": [2.50, 3.00], "recurring_pricing_types": ["flat", "per_foot"], "recurring_price_per_foot": [0, 0.10], "recurring_flat_price": [33.00, 0]} means 0-399ft: $2.50/ft initial + $33/mo flat recurring, 400+ft: $3.00/ft initial + $0.10/ft recurring.';

-- Helper function to create recurring_pricing_types array
CREATE OR REPLACE FUNCTION create_recurring_types_array(
  pricing JSONB,
  default_type TEXT DEFAULT 'per_foot'
) RETURNS JSONB AS $$
DECLARE
  array_length INT;
  result JSONB;
BEGIN
  -- Get the length of initial_price_per_foot array
  array_length := GREATEST(1, jsonb_array_length(COALESCE(pricing->'initial_price_per_foot', '[]'::jsonb)));

  -- If recurring_pricing_type exists, use that value for all intervals
  IF pricing ? 'recurring_pricing_type' THEN
    SELECT jsonb_agg(pricing->>'recurring_pricing_type')
    INTO result
    FROM generate_series(1, array_length);
  ELSE
    -- Otherwise use default
    SELECT jsonb_agg(default_type)
    INTO result
    FROM generate_series(1, array_length);
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Convert existing recurring_pricing_type (string) to recurring_pricing_types (array)
-- Replicate the type across all pricing slots for backwards compatibility
UPDATE service_plans
SET linear_feet_pricing =
  linear_feet_pricing
  - 'recurring_pricing_type'  -- Remove old field if it exists
  || jsonb_build_object(
    'recurring_pricing_types',
    create_recurring_types_array(linear_feet_pricing)
  )
WHERE linear_feet_pricing IS NOT NULL
  AND NOT (linear_feet_pricing ? 'recurring_pricing_types');

-- Clean up helper function
DROP FUNCTION IF EXISTS create_recurring_types_array;

-- For any service plans without linear_feet_pricing, set full default structure with array
UPDATE service_plans
SET linear_feet_pricing = '{
  "pricing_mode": "tiered",
  "initial_price_per_foot": [2.00],
  "recurring_pricing_types": ["per_foot"],
  "recurring_price_per_foot": [1.50],
  "recurring_flat_price": [0]
}'::jsonb
WHERE linear_feet_pricing IS NULL;
