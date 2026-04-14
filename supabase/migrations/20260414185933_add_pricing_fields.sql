-- Migration: Add advanced pricing fields to service_plans and add_on_services
-- Adds: minimum_price, pricing_type, additional_unit_price, variants, percentage_pricing

-- ── Migration 1: minimum_price ────────────────────────────────────────────
-- Enables a price floor on any service or add-on (e.g. attic clean-out $2,400 min,
-- bed bug $699 min, exclusion $300 min, etc.)

ALTER TABLE service_plans
  ADD COLUMN IF NOT EXISTS minimum_price DECIMAL(10,2);

ALTER TABLE add_on_services
  ADD COLUMN IF NOT EXISTS minimum_price DECIMAL(10,2);

-- ── Migration 2: advanced add-on pricing fields ───────────────────────────

-- pricing_type: controls how the add-on price is computed
--   'flat'            – default; uses initial_price as-is
--   'per_sqft'        – uses home_size_pricing JSONB intervals
--   'per_linear_foot' – uses linear_feet_pricing JSONB intervals
--   'per_acre'        – uses yard_size_pricing JSONB intervals
--   'per_hour'        – rate stored in initial_price; quantity entered at quote time
--   'per_room'        – first room in initial_price, extra rooms in additional_unit_price
ALTER TABLE add_on_services
  ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'flat'
    CHECK (pricing_type IN ('flat', 'per_sqft', 'per_linear_foot', 'per_acre', 'per_hour', 'per_room'));

-- additional_unit_price: second-unit rate for per_room (and similar stepped) pricing
ALTER TABLE add_on_services
  ADD COLUMN IF NOT EXISTS additional_unit_price DECIMAL(10,2);

-- variants: optional array of selectable options that override the base price.
-- For flat/per_hour/per_room: [{ "label": "Twin", "initial_price": 65 }, ...]
-- For per_sqft/per_linear_foot: [{ "label": "6\" (R-19)", "price_per_unit": 2.60 }, ...]
ALTER TABLE add_on_services
  ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- percentage_pricing: for add-ons priced as a % of a related job
-- e.g. { "percentage": 20, "years": 1, "minimum": 250 }
-- The UI collects the job total and computes: max(percentage * job_cost * years, minimum)
ALTER TABLE add_on_services
  ADD COLUMN IF NOT EXISTS percentage_pricing JSONB;

-- variants on service_plans: same variant structure as add_on_services
ALTER TABLE service_plans
  ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
