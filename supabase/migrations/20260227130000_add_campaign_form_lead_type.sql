-- Add campaign_form to leads lead_type CHECK constraint

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_type_check;
ALTER TABLE leads ADD CONSTRAINT leads_lead_type_check
  CHECK (lead_type IN (
    -- new values
    'inbound_call','outbound_call','website_form','widget_form',
    'campaign_call','campaign_email','campaign_text','campaign_form',
    'manual','email_inbound',
    -- legacy values (existing records only, not selectable in UI)
    'phone_call','web_form','bulk_add','email','chat','social_media','in_person','other'
  ));
