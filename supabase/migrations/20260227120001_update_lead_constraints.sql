-- Update lead_source and lead_type CHECK constraints on leads table
-- to include new taxonomy values while keeping legacy values for existing records

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_lead_source_check
  CHECK (lead_source IN (
    -- new values
    'google_ads','google_organic','facebook_ads','referral','direct','campaign','widget','other',
    -- legacy values (existing records only, not selectable in UI)
    'organic','google_cpc','linkedin','email_campaign','cold_call','trade_show',
    'webinar','content_marketing','widget_submission'
  ));

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_type_check;
ALTER TABLE leads ADD CONSTRAINT leads_lead_type_check
  CHECK (lead_type IN (
    -- new values
    'inbound_call','outbound_call','website_form','widget_form',
    'campaign_call','campaign_email','campaign_text','manual','email_inbound',
    -- legacy values (existing records only, not selectable in UI)
    'phone_call','web_form','bulk_add','email','chat','social_media','in_person','other'
  ));
