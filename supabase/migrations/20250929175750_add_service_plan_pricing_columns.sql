-- Add pricing columns to service_plans table for home and yard size pricing
ALTER TABLE service_plans
ADD COLUMN IF NOT EXISTS home_size_pricing JSONB DEFAULT '{
  "initial_cost_per_interval": 20.00,
  "recurring_cost_per_interval": 10.00
}'::jsonb;

ALTER TABLE service_plans
ADD COLUMN IF NOT EXISTS yard_size_pricing JSONB DEFAULT '{
  "initial_cost_per_interval": 25.00,
  "recurring_cost_per_interval": 15.00
}'::jsonb;

-- Add comment to explain the pricing structure
COMMENT ON COLUMN service_plans.home_size_pricing IS 'JSON object containing initial_cost_per_interval and recurring_cost_per_interval for home size pricing. These costs are multiplied by the number of intervals above the base size.';

COMMENT ON COLUMN service_plans.yard_size_pricing IS 'JSON object containing initial_cost_per_interval and recurring_cost_per_interval for yard size pricing. These costs are multiplied by the number of intervals above the base size.';