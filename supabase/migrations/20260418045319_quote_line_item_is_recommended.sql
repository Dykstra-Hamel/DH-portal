-- Add is_recommended column to quote_line_items
-- true  = inspector explicitly highlighted this add-on as recommended
-- false = auto-added because it belongs to the plan's recommended_addon_ids, but inspector did not highlight it
-- null  = not a recommended add-on slot (inspector manually added from Additional Recommendations, or a plan/bundle/custom item)

ALTER TABLE quote_line_items
  ADD COLUMN IF NOT EXISTS is_recommended boolean DEFAULT null;
