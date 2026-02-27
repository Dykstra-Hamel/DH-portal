-- Update source and type CHECK constraints on tickets table
-- to include new taxonomy values while keeping legacy values for existing records

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_source_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_source_check
  CHECK (source IN (
    -- new values
    'google_ads','google_organic','facebook_ads','referral','direct','campaign','widget','other',
    -- legacy values (existing records only, not selectable in UI)
    'organic','google_cpc','linkedin','email_campaign','cold_call','trade_show',
    'webinar','content_marketing','internal','inbound','outbound','website'
  ));

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_type_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_type_check
  CHECK (type IN (
    -- new values
    'inbound_call','outbound_call','website_form','widget_form',
    'campaign_call','campaign_email','campaign_text','manual','email_inbound',
    -- legacy values (existing records only, not selectable in UI)
    'phone_call','web_form','email','chat','social_media','in_person',
    'internal_task','bug_report','feature_request','other'
  ));
