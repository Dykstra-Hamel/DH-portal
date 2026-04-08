-- Add 'inspector' as a valid lead source
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_lead_source_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_lead_source_check
  CHECK (lead_source IN (
    'organic', 'referral', 'google_cpc', 'facebook_ads', 'linkedin',
    'email_campaign', 'cold_call', 'trade_show', 'webinar',
    'content_marketing', 'other',
    'google_ads', 'google_organic', 'direct', 'campaign', 'widget',
    'widget_submission', 'technician', 'inspector'
  ));
