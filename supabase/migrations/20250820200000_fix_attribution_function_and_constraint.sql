-- FIX ATTRIBUTION FUNCTION AND EXPAND LEAD SOURCE CONSTRAINT
-- Root cause: determine_lead_source_from_attribution() returns 'bing_cpc' and 'social_media'
-- but the constraint doesn't allow these values

-- First, drop the existing constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_lead_source_check;

-- Recreate constraint with expanded values to support realistic lead sources
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
    'paid',         -- NEW: Generic paid traffic (Bing, other paid sources)
    'social_media', -- NEW: Social media traffic
    'other'
));

-- Update the determine_lead_source_from_attribution function to use 'paid' instead of 'bing_cpc'
CREATE OR REPLACE FUNCTION public.determine_lead_source_from_attribution(attribution JSONB)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    utm_source TEXT;
    utm_medium TEXT;
    gclid_value TEXT;
    traffic_source TEXT;
    referrer_domain TEXT;
BEGIN
    -- Extract values from attribution JSONB
    utm_source := attribution->>'utm_source';
    utm_medium := attribution->>'utm_medium';
    gclid_value := attribution->>'gclid';
    traffic_source := attribution->>'traffic_source';
    referrer_domain := attribution->>'referrer_domain';
    
    -- Determine lead source based on attribution data
    IF gclid_value IS NOT NULL OR (utm_source = 'google' AND utm_medium = 'cpc') THEN
        RETURN 'google_cpc';
    ELSIF utm_source = 'facebook' AND utm_medium IN ('paid', 'cpc', 'ads') THEN
        RETURN 'facebook_ads';
    ELSIF utm_source = 'linkedin' THEN
        RETURN 'linkedin';
    ELSIF utm_source = 'bing' AND utm_medium = 'cpc' THEN
        RETURN 'paid';  -- FIXED: Changed from 'bing_cpc' to 'paid'
    ELSIF traffic_source = 'organic' THEN
        RETURN 'organic';
    ELSIF traffic_source = 'social' OR referrer_domain IN ('facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com') THEN
        RETURN 'social_media';  -- This is now allowed by the expanded constraint
    ELSIF traffic_source = 'referral' THEN
        RETURN 'referral';
    ELSIF traffic_source = 'direct' THEN
        RETURN 'other';
    ELSE
        RETURN 'other';
    END IF;
END;
$function$;

-- Add comment documenting the fix
COMMENT ON CONSTRAINT leads_lead_source_check ON leads IS 'Expanded constraint to support paid and social_media lead sources from attribution function - 2025-08-20';