-- Add bundle_plan_id to quote_line_items table
-- Bundles are stored as line items alongside service plans and add-ons

-- Add new column for bundle plans
ALTER TABLE quote_line_items
ADD COLUMN bundle_plan_id UUID REFERENCES bundle_plans(id) ON DELETE SET NULL;

-- Drop existing constraint that only allowed service_plan_id OR addon_service_id
ALTER TABLE quote_line_items
DROP CONSTRAINT IF EXISTS check_line_item_type;

-- Add new constraint: must have exactly ONE of service_plan_id, addon_service_id, or bundle_plan_id
ALTER TABLE quote_line_items
ADD CONSTRAINT check_line_item_type CHECK (
  (service_plan_id IS NOT NULL AND addon_service_id IS NULL AND bundle_plan_id IS NULL) OR
  (service_plan_id IS NULL AND addon_service_id IS NOT NULL AND bundle_plan_id IS NULL) OR
  (service_plan_id IS NULL AND addon_service_id IS NULL AND bundle_plan_id IS NOT NULL)
);

-- Add index for efficient bundle lookups
CREATE INDEX idx_quote_line_items_bundle_id ON quote_line_items(bundle_plan_id);

-- Add documentation
COMMENT ON COLUMN quote_line_items.bundle_plan_id IS
'Reference to bundle plan. Mutually exclusive with service_plan_id and addon_service_id - each line item is either a service plan OR an add-on OR a bundle.';
