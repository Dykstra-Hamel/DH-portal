-- Add campaign_id foreign key to leads table for proper campaign attribution

-- Add campaign_id column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);

-- Add comment
COMMENT ON COLUMN leads.campaign_id IS 'Direct reference to the campaign that generated this lead (if applicable)';
