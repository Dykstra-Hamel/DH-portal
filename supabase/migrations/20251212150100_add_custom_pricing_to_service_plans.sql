-- Add custom pricing functionality to service plans and quote line items
-- This allows sales reps to set custom prices that override calculated prices

-- Add allow_custom_pricing flag to service_plans table
ALTER TABLE service_plans
ADD COLUMN allow_custom_pricing BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN service_plans.allow_custom_pricing IS 'When true, allows sales reps to set custom prices for this plan in quotes instead of using calculated prices';

-- Add custom price fields to quote_line_items table
ALTER TABLE quote_line_items
ADD COLUMN custom_initial_price DECIMAL(10, 2),
ADD COLUMN custom_recurring_price DECIMAL(10, 2),
ADD COLUMN is_custom_priced BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN quote_line_items.custom_initial_price IS 'Custom initial price set by sales rep (overrides calculated price)';
COMMENT ON COLUMN quote_line_items.custom_recurring_price IS 'Custom recurring price set by sales rep (overrides calculated price)';
COMMENT ON COLUMN quote_line_items.is_custom_priced IS 'Flag indicating if this line item uses custom pricing';
