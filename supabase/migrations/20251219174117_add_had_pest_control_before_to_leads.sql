-- Add had_pest_control_before column to leads table
-- This allows salespeople to track if a customer has had pest control service before
-- during the quoting process

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS had_pest_control_before TEXT
CHECK (had_pest_control_before IN ('yes', 'no', 'not_sure'));

-- Add comment for documentation
COMMENT ON COLUMN leads.had_pest_control_before IS 'Whether the customer has had pest control service before. Values: yes, no, not_sure, or NULL';
