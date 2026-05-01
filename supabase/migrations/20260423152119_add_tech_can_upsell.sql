-- Add tech_can_upsell boolean column to service_plans and add_on_services tables
ALTER TABLE service_plans
  ADD COLUMN IF NOT EXISTS tech_can_upsell BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE add_on_services
  ADD COLUMN IF NOT EXISTS tech_can_upsell BOOLEAN NOT NULL DEFAULT FALSE;
