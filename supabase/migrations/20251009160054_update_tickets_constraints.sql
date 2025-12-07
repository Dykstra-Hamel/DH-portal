-- Update tickets table constraints to include new source values
-- This migration adds new allowed source values to support the updated ticket form
-- Note: Type/format values are mapped in the form (call->phone_call, form->web_form)

-- Drop existing constraints
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_source_check;

-- Add updated source constraint (keeping all old values + adding new ones)
-- Old values: organic, referral, google_cpc, facebook_ads, linkedin, email_campaign, cold_call, trade_show, webinar, content_marketing, internal, other
-- New values: inbound, outbound, widget, website
ALTER TABLE tickets ADD CONSTRAINT tickets_source_check
    CHECK (source IN (
        -- Original values
        'organic', 'referral', 'google_cpc', 'facebook_ads', 'linkedin', 'email_campaign',
        'cold_call', 'trade_show', 'webinar', 'content_marketing', 'internal', 'other',
        -- New values for form
        'inbound', 'outbound', 'widget', 'website'
    ));
