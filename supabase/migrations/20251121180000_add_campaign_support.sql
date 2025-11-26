-- Add campaign support to form_submissions and leads tables

-- Add campaign_id and lead_id columns to form_submissions
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS campaign_id TEXT;
ALTER TABLE form_submissions ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Create index for campaign_id queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_campaign_id ON form_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_lead_id ON form_submissions(lead_id);

-- Update any non-standard lead_source values to 'other' before updating the constraint
UPDATE leads SET lead_source = 'other'
WHERE lead_source IS NOT NULL
AND lead_source NOT IN ('organic', 'referral', 'google_cpc', 'facebook_ads', 'linkedin', 'email_campaign', 'cold_call', 'trade_show', 'webinar', 'content_marketing', 'campaign', 'other');

-- Update leads.lead_source CHECK constraint to include 'campaign'
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_lead_source_check
    CHECK (lead_source IN ('organic', 'referral', 'google_cpc', 'facebook_ads', 'linkedin', 'email_campaign', 'cold_call', 'trade_show', 'webinar', 'content_marketing', 'campaign', 'other'));

-- Add comments
COMMENT ON COLUMN form_submissions.campaign_id IS 'Campaign identifier for attribution tracking. Will be linked to campaigns table when available.';
COMMENT ON COLUMN form_submissions.lead_id IS 'Reference to lead created from this form submission (used when campaign_id is present)';
