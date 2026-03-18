-- Allow quote line items to be marked as optional and toggled by the customer
-- on the public quote page.

ALTER TABLE quote_line_items
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_selected BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN quote_line_items.is_optional IS 'When true, the customer can toggle this item on/off on the public quote page';
COMMENT ON COLUMN quote_line_items.is_selected  IS 'Whether the customer has this item selected. Only selected items count toward quote totals.';
