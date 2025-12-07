-- Add lead_stage column to leads table
ALTER TABLE leads
ADD COLUMN lead_stage VARCHAR(50)
CHECK (lead_stage IN ('assign_stage', 'communication_stage', 'quote_stage', 'schedule_stage'));

-- Create index for lead_stage
CREATE INDEX IF NOT EXISTS idx_leads_lead_stage ON leads(lead_stage);
