-- Allow $0 recurring prices when linear feet pricing is configured
-- This migration updates the recurring price constraint to allow zero values when linear_feet_pricing is set
-- Note: initial_price can be $0 for legitimate use cases (free initial service, assessments, promotions)

-- Step 1: Drop the existing recurring price constraint
ALTER TABLE service_plans
DROP CONSTRAINT IF EXISTS service_plans_subscription_recurring_price_check;

-- Step 2: Add updated constraint that allows recurring_price = 0 when linear_feet_pricing is configured
ALTER TABLE service_plans
ADD CONSTRAINT service_plans_subscription_recurring_price_check
CHECK (
  plan_category = 'one-time'
  OR linear_feet_pricing IS NOT NULL
  OR (recurring_price IS NOT NULL AND recurring_price > 0)
);

-- Update comment to document the new behavior
COMMENT ON CONSTRAINT service_plans_subscription_recurring_price_check ON service_plans IS
'Ensures subscription plans have recurring_price > 0, unless linear_feet_pricing is configured';
