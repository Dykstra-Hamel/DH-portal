-- Migration: Fix widget_submission attribution trigger
-- Purpose: Update the determine_lead_source_from_attribution function to properly recognize widget_submission leads
-- Date: 2025-08-22

-- Update the determine_lead_source_from_attribution function to handle widget submissions
CREATE OR REPLACE FUNCTION determine_lead_source_from_attribution(attribution JSONB)
RETURNS VARCHAR(50) AS $$
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
        RETURN 'bing_cpc';
    -- NEW: Support for widget form submissions
    ELSIF traffic_source = 'widget_form' OR utm_source = 'widget' OR utm_medium = 'form' THEN
        RETURN 'widget_submission';
    ELSIF traffic_source = 'organic' THEN
        RETURN 'organic';
    ELSIF traffic_source = 'social' OR referrer_domain IN ('facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com') THEN
        RETURN 'social_media';
    ELSIF traffic_source = 'referral' THEN
        RETURN 'referral';
    ELSIF traffic_source = 'direct' THEN
        RETURN 'other'; -- Maps to existing 'other' category
    ELSE
        RETURN 'other';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update function comment
COMMENT ON FUNCTION determine_lead_source_from_attribution(JSONB) IS 'Intelligently determines lead source from attribution data, including widget_submission support - Updated 2025-08-22';

-- Test the function with sample widget attribution data
DO $$
DECLARE
    test_result VARCHAR(50);
BEGIN
    -- Test widget submission attribution
    SELECT determine_lead_source_from_attribution('{
        "traffic_source": "widget_form",
        "utm_source": "widget",
        "utm_medium": "form",
        "test_data": true
    }'::jsonb) INTO test_result;
    
    -- Log the test result
    RAISE NOTICE 'Widget attribution test result: %', test_result;
    
    -- Ensure the result is correct
    IF test_result != 'widget_submission' THEN
        RAISE EXCEPTION 'Widget attribution test failed. Expected: widget_submission, Got: %', test_result;
    END IF;
    
    RAISE NOTICE 'Widget submission attribution fix applied successfully!';
END $$;