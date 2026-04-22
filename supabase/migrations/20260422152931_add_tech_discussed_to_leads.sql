-- Track whether the submitting technician discussed a TechLeads opportunity
-- with the customer before submitting. Nullable: only populated for leads
-- whose lead_source is 'technician' (i.e., generated from the TechLeads flow).
-- All other leads remain NULL.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS tech_discussed boolean;

COMMENT ON COLUMN leads.tech_discussed IS
  'For lead_source=technician leads: true if the technician checked "Discussed with customer" before submitting, false otherwise. NULL for non-technician leads.';
