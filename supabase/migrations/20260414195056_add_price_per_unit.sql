-- Migration: Add price_per_unit to add_on_services; pricing_unit + price_per_unit to service_plans
--
-- add_on_services already has pricing_type ('per_sqft', 'per_linear_foot', 'per_acre').
-- This adds the rate column so those pricing types can be fully computed without a manual override.
--
-- service_plans get both a unit signal (pricing_unit) and the rate (price_per_unit).
-- This is a separate, simpler pricing model from the tiered linear_feet_pricing JSONB —
-- a plan can use one or the other but not both simultaneously.

ALTER TABLE add_on_services
  ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10,2);

ALTER TABLE service_plans
  ADD COLUMN IF NOT EXISTS pricing_unit TEXT
    CHECK (pricing_unit IN ('sqft', 'linear_feet', 'acres')),
  ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(10,2);
