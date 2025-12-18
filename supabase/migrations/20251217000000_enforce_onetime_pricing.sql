-- Enforce recurring_price = 0 for One-Time Service Plans
-- This migration adds CHECK constraints to ensure data integrity for one-time and subscription plans

-- Step 1: Fix existing data to comply with constraints
-- Update any existing one-time plans to have recurring_price = 0 and billing_frequency = NULL
UPDATE service_plans
SET
  recurring_price = 0,
  billing_frequency = NULL
WHERE plan_category = 'one-time';

-- Step 2: Add CHECK constraint: one-time plans must have recurring_price = 0
ALTER TABLE service_plans
ADD CONSTRAINT service_plans_onetime_recurring_price_check
CHECK (
  plan_category != 'one-time' OR recurring_price = 0
);

-- Step 3: Add CHECK constraint: one-time plans must have null billing_frequency
ALTER TABLE service_plans
ADD CONSTRAINT service_plans_onetime_billing_frequency_check
CHECK (
  plan_category != 'one-time' OR billing_frequency IS NULL
);

-- Step 4: Add CHECK constraint: non-one-time plans must have recurring_price > 0
ALTER TABLE service_plans
ADD CONSTRAINT service_plans_subscription_recurring_price_check
CHECK (
  plan_category = 'one-time' OR (recurring_price IS NOT NULL AND recurring_price > 0)
);

-- Step 5: Add CHECK constraint: non-one-time plans must have billing_frequency
ALTER TABLE service_plans
ADD CONSTRAINT service_plans_subscription_billing_frequency_check
CHECK (
  plan_category = 'one-time' OR billing_frequency IS NOT NULL
);

-- Add comments to document the constraints
COMMENT ON CONSTRAINT service_plans_onetime_recurring_price_check ON service_plans IS
'Ensures one-time service plans always have recurring_price = 0';

COMMENT ON CONSTRAINT service_plans_onetime_billing_frequency_check ON service_plans IS
'Ensures one-time service plans have null billing_frequency';

COMMENT ON CONSTRAINT service_plans_subscription_recurring_price_check ON service_plans IS
'Ensures subscription plans have recurring_price > 0';

COMMENT ON CONSTRAINT service_plans_subscription_billing_frequency_check ON service_plans IS
'Ensures subscription plans have a billing_frequency';
