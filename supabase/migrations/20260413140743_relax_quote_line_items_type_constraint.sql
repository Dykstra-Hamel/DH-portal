-- Relax the quote_line_items type constraint to allow custom/manual line items
-- from the Field Map wizard that have no catalog reference (all three FKs are null).
-- Previously the constraint required exactly one of the three to be non-null,
-- which silently rejected addon, bundle, and custom line item inserts.

ALTER TABLE quote_line_items
DROP CONSTRAINT IF EXISTS check_line_item_type;

ALTER TABLE quote_line_items
ADD CONSTRAINT check_line_item_type CHECK (
  (
    (service_plan_id IS NOT NULL)::int +
    (addon_service_id IS NOT NULL)::int +
    (bundle_plan_id IS NOT NULL)::int
  ) <= 1
);
