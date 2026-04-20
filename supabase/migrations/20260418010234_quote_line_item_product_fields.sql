-- Add parent_line_item_id to support product grouping under a plan
ALTER TABLE quote_line_items
  ADD COLUMN IF NOT EXISTS parent_line_item_id UUID;
  -- No FK intentionally — batch insert ordering would require DEFERRABLE constraint

-- Add quantity for product line items (qty × unit_price = initial_price)
ALTER TABLE quote_line_items
  ADD COLUMN IF NOT EXISTS quantity INTEGER;

CREATE INDEX IF NOT EXISTS idx_quote_line_items_parent
  ON quote_line_items(parent_line_item_id)
  WHERE parent_line_item_id IS NOT NULL;
