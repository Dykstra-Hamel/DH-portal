-- Add property_type column to leads table
-- Captures whether a lead is for a residential or commercial property.
-- Populated by the Tech Leads "Send Lead" flow; NULL for legacy leads and
-- for flows where the property type is not collected.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS property_type VARCHAR(20) NULL;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_property_type_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_property_type_check
  CHECK (property_type IS NULL OR property_type IN ('residential', 'commercial'));

COMMENT ON COLUMN leads.property_type IS
  'Residential or commercial classification captured at lead creation; used for routing and reporting.';
