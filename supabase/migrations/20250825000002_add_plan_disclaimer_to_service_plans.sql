-- Add plan_disclaimer column to service_plans table
ALTER TABLE service_plans
ADD COLUMN plan_disclaimer TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN service_plans.plan_disclaimer IS 'Rich text disclaimer content specific to this plan';