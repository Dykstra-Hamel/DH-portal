-- Add initial_discount column to service_plans table
ALTER TABLE service_plans
ADD COLUMN initial_discount DECIMAL(10,2) DEFAULT 0.00;

-- Add comment to describe the column
COMMENT ON COLUMN service_plans.initial_discount IS 'Amount discounted from the original initial price to show savings';