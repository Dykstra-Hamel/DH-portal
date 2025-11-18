-- Add discount_id column to quote_line_items table to link to company_discounts
ALTER TABLE quote_line_items
ADD COLUMN discount_id UUID REFERENCES company_discounts(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_quote_line_items_discount_id ON quote_line_items(discount_id);

-- Add comment for documentation
COMMENT ON COLUMN quote_line_items.discount_id IS 'Reference to the company discount configuration that was applied to this line item';
