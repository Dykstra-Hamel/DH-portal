-- Add 'technician' as a valid lead source
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_lead_source_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_lead_source_check
  CHECK (lead_source IN (
    'organic', 'referral', 'google_cpc', 'facebook_ads', 'linkedin',
    'email_campaign', 'cold_call', 'trade_show', 'webinar',
    'content_marketing', 'other',
    'google_ads', 'google_organic', 'direct', 'campaign', 'widget',
    'widget_submission', 'technician'
  ));

-- Track which user submitted the lead (distinct from assigned_to which is the salesperson)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_submitted_by ON leads(submitted_by);
