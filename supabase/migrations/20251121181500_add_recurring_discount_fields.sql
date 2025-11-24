-- Add separate recurring discount type and value for "both" discounts
-- When applies_to_price = 'both', these fields allow different discount settings for recurring vs initial

ALTER TABLE company_discounts
ADD COLUMN recurring_discount_type TEXT CHECK (recurring_discount_type IN ('percentage', 'fixed_amount')),
ADD COLUMN recurring_discount_value DECIMAL(10,2) CHECK (recurring_discount_value >= 0);

-- Add comments
COMMENT ON COLUMN company_discounts.recurring_discount_type IS 'Discount type for recurring price when applies_to_price = both. If null, uses discount_type.';
COMMENT ON COLUMN company_discounts.recurring_discount_value IS 'Discount value for recurring price when applies_to_price = both. If null, uses discount_value.';
