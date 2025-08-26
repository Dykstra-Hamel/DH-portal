-- Migration: Add widget_submission to lead_source constraint
-- Purpose: Enable widget form submissions to be stored with lead_source = 'widget_submission'
-- Date: 2025-08-22

-- Drop the existing constraint if it exists
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_source_check;

-- Recreate constraint with widget_submission included
ALTER TABLE leads ADD CONSTRAINT leads_lead_source_check 
CHECK (lead_source IN (
    'organic',
    'referral', 
    'google_cpc',
    'facebook_ads',
    'linkedin',
    'email_campaign',
    'cold_call',
    'trade_show',
    'webinar',
    'content_marketing',
    'paid',
    'social_media',
    'widget_submission',  -- NEW: Widget form submissions
    'other'
));

-- Add documentation comment
COMMENT ON CONSTRAINT leads_lead_source_check ON leads IS 
'Updated to include widget_submission for widget form submissions - 2025-08-22';