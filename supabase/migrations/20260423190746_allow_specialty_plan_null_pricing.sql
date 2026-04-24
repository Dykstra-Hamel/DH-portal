-- Allow specialty plans to have recurring_price = 0 and billing_frequency = NULL
-- (same exemption one-time plans already have)

-- Drop and recreate recurring_price constraint
ALTER TABLE service_plans DROP CONSTRAINT service_plans_subscription_recurring_price_check;
ALTER TABLE service_plans
ADD CONSTRAINT service_plans_subscription_recurring_price_check
CHECK (
  plan_category IN ('one-time', 'specialty')
  OR (recurring_price IS NOT NULL AND recurring_price > 0)
);

-- Drop and recreate billing_frequency constraint
ALTER TABLE service_plans DROP CONSTRAINT service_plans_subscription_billing_frequency_check;
ALTER TABLE service_plans
ADD CONSTRAINT service_plans_subscription_billing_frequency_check
CHECK (
  plan_category IN ('one-time', 'specialty')
  OR billing_frequency IS NOT NULL
);
