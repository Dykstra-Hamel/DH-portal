-- Documentation for Custom Interval Pricing Feature
-- This migration adds documentation for the new pricing modes in service plans.
-- No table structure changes needed - JSONB columns already support any structure.

-- Document the home_size_pricing structure
COMMENT ON COLUMN service_plans.home_size_pricing IS
'Pricing configuration for home size intervals. Supports two modes:
1. Linear Mode (default): pricing_mode="linear" or not set
   - Uses initial_cost_per_interval and recurring_cost_per_interval
   - Each interval adds the same amount (e.g., $0, $20, $40, $60...)

2. Custom Mode: pricing_mode="custom"
   - Uses custom_initial_prices and custom_recurring_prices arrays
   - Each interval has an exact price (e.g., $0, $15, $35, $80...)

Structure: {
  pricing_mode: "linear" | "custom",
  initial_cost_per_interval: number,
  recurring_cost_per_interval: number,
  custom_initial_prices?: number[],
  custom_recurring_prices?: number[]
}

Example Linear Mode:
{
  "pricing_mode": "linear",
  "initial_cost_per_interval": 20.00,
  "recurring_cost_per_interval": 10.00
}

Example Custom Mode:
{
  "pricing_mode": "custom",
  "initial_cost_per_interval": 20.00,
  "recurring_cost_per_interval": 10.00,
  "custom_initial_prices": [0, 15, 35, 60, 100],
  "custom_recurring_prices": [0, 8, 18, 30, 50]
}';

-- Document the yard_size_pricing structure (same as home_size_pricing)
COMMENT ON COLUMN service_plans.yard_size_pricing IS
'Pricing configuration for yard size intervals. Same structure as home_size_pricing.
Supports two modes:
1. Linear Mode (default): pricing_mode="linear" or not set
2. Custom Mode: pricing_mode="custom"

See home_size_pricing column documentation for details.';
