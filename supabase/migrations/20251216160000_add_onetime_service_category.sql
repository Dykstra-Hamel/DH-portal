-- Add 'one-time' category option to service plans
-- Make recurring_price and billing_frequency nullable for one-time services

-- Step 1: Make recurring_price and billing_frequency nullable
ALTER TABLE service_plans
ALTER COLUMN recurring_price DROP NOT NULL,
ALTER COLUMN billing_frequency DROP NOT NULL;

-- Step 2: Update the CHECK constraint on billing_frequency to allow NULL
-- First drop the existing constraint
ALTER TABLE service_plans
DROP CONSTRAINT IF EXISTS service_plans_billing_frequency_check;

-- Add new constraint that allows NULL or valid values
ALTER TABLE service_plans
ADD CONSTRAINT service_plans_billing_frequency_check
CHECK (billing_frequency IS NULL OR billing_frequency IN ('monthly', 'quarterly', 'semi-annually', 'annually'));

-- Step 3: Add comment to document the one-time category
COMMENT ON COLUMN service_plans.plan_category IS 'Service plan category: basic, standard, premium, or one-time';
COMMENT ON COLUMN service_plans.recurring_price IS 'Recurring price for subscription plans. NULL for one-time services.';
COMMENT ON COLUMN service_plans.billing_frequency IS 'Billing frequency for subscription plans. NULL for one-time services.';

-- Note: plan_category doesn't have a CHECK constraint in the original schema,
-- so no need to update it. It accepts any text value.
