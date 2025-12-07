-- Add service_frequency column to quote_line_items
ALTER TABLE quote_line_items
ADD COLUMN service_frequency VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN quote_line_items.service_frequency IS 'Service frequency: monthly, quarterly, semi-annually, annually';
