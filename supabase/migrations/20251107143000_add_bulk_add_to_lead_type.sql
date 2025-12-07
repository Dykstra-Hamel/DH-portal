-- Add 'bulk_add' to lead_type constraint
-- Drop the existing CHECK constraint on lead_type
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_type_check;

-- Add new CHECK constraint with 'bulk_add' included
ALTER TABLE leads ADD CONSTRAINT leads_lead_type_check
  CHECK (lead_type IN ('phone_call', 'web_form', 'bulk_add', 'email', 'chat', 'social_media', 'in_person', 'other'));
