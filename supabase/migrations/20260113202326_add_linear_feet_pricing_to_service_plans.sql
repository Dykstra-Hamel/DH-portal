-- Add linear feet pricing column to service_plans table
ALTER TABLE service_plans
ADD COLUMN IF NOT EXISTS linear_feet_pricing JSONB DEFAULT '{
  "initial_cost_per_interval": 15.00,
  "recurring_cost_per_interval": 8.00
}'::jsonb;

-- Add comment to explain the pricing structure
COMMENT ON COLUMN service_plans.linear_feet_pricing IS 'JSON object containing initial_cost_per_interval and recurring_cost_per_interval for linear feet pricing. Supports both linear mode (multiplied by interval index) and custom mode (array of exact prices per interval). Example: {"pricing_mode": "linear", "initial_cost_per_interval": 15.00, "recurring_cost_per_interval": 8.00} or {"pricing_mode": "custom", "custom_initial_prices": [0, 15, 30, 50], "custom_recurring_prices": [0, 8, 16, 24]}';
