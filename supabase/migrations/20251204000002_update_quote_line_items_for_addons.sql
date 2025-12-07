-- Update quote_line_items table to support add-on services
-- Add-ons are stored as line items alongside service plans

-- Add new column for add-on services
ALTER TABLE quote_line_items
ADD COLUMN addon_service_id UUID REFERENCES add_on_services(id) ON DELETE SET NULL;

-- Add constraint: must have either service_plan_id OR addon_service_id (not both, not neither)
-- This ensures each line item is either a service plan OR an add-on
ALTER TABLE quote_line_items
ADD CONSTRAINT check_line_item_type CHECK (
  (service_plan_id IS NOT NULL AND addon_service_id IS NULL) OR
  (service_plan_id IS NULL AND addon_service_id IS NOT NULL)
);

-- Add index for efficient addon lookups
CREATE INDEX idx_quote_line_items_addon_id ON quote_line_items(addon_service_id);

-- Add documentation
COMMENT ON COLUMN quote_line_items.addon_service_id IS
'Reference to add-on service. Mutually exclusive with service_plan_id - each line item is either a service plan OR an add-on.';
