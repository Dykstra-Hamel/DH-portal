-- FIX CORRUPTED LEADS_LEAD_SOURCE_CHECK CONSTRAINT
-- The constraint appears to be corrupted or doesn't match our expectations
-- Recreate it with the exact values the seed script expects

-- Drop the existing constraint if it exists
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_source_check;

-- Recreate the constraint with the correct allowed values
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
    'other'
));

-- Add a comment to document this fix
COMMENT ON CONSTRAINT leads_lead_source_check ON leads IS 'Fixed constraint to match seed script expectations - 2025-08-20';