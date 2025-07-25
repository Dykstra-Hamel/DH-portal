-- Enhance leads table with attribution tracking fields
-- Add partial_lead_id to link completed leads back to their partial submission
ALTER TABLE leads ADD COLUMN IF NOT EXISTS partial_lead_id UUID REFERENCES partial_leads(id) ON DELETE SET NULL;

-- Add GCLID field for Google Ads click tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gclid VARCHAR(255);

-- Add comprehensive attribution data as JSONB for flexible storage
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attribution_data JSONB DEFAULT '{}';

-- Ensure existing UTM fields exist (they should already be there, but this ensures it)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);

-- Create indexes for the new attribution fields
CREATE INDEX IF NOT EXISTS idx_leads_partial_lead_id ON leads(partial_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_gclid ON leads(gclid);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_utm_medium ON leads(utm_medium);
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON leads(utm_campaign);

-- Create GIN index for JSONB attribution_data column for efficient queries
CREATE INDEX IF NOT EXISTS idx_leads_attribution_data_gin ON leads USING GIN(attribution_data);

-- Add helpful comments for documentation
COMMENT ON COLUMN leads.partial_lead_id IS 'Links back to the original partial lead submission if user completed form later';
COMMENT ON COLUMN leads.gclid IS 'Google Ads Click Identifier for conversion tracking';
COMMENT ON COLUMN leads.attribution_data IS 'Complete attribution context including referrer, traffic source, and session data';

-- Create a function to extract lead source from attribution data
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

-- Create a trigger function to automatically set lead_source based on attribution data
CREATE OR REPLACE FUNCTION set_lead_source_from_attribution()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-set lead_source if it's not already set and we have attribution data
    IF (NEW.lead_source IS NULL OR NEW.lead_source = 'other') AND NEW.attribution_data IS NOT NULL THEN
        NEW.lead_source = determine_lead_source_from_attribution(NEW.attribution_data);
    END IF;
    
    -- Extract individual UTM fields from attribution_data if they're not already set
    IF NEW.utm_source IS NULL AND NEW.attribution_data ? 'utm_source' THEN
        NEW.utm_source = NEW.attribution_data->>'utm_source';
    END IF;
    
    IF NEW.utm_medium IS NULL AND NEW.attribution_data ? 'utm_medium' THEN
        NEW.utm_medium = NEW.attribution_data->>'utm_medium';
    END IF;
    
    IF NEW.utm_campaign IS NULL AND NEW.attribution_data ? 'utm_campaign' THEN
        NEW.utm_campaign = NEW.attribution_data->>'utm_campaign';
    END IF;
    
    IF NEW.utm_term IS NULL AND NEW.attribution_data ? 'utm_term' THEN
        NEW.utm_term = NEW.attribution_data->>'utm_term';
    END IF;
    
    IF NEW.utm_content IS NULL AND NEW.attribution_data ? 'utm_content' THEN
        NEW.utm_content = NEW.attribution_data->>'utm_content';
    END IF;
    
    IF NEW.gclid IS NULL AND NEW.attribution_data ? 'gclid' THEN
        NEW.gclid = NEW.attribution_data->>'gclid';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set attribution fields
DROP TRIGGER IF EXISTS trigger_set_lead_attribution ON leads;
CREATE TRIGGER trigger_set_lead_attribution
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION set_lead_source_from_attribution();

-- Add comments for the new functions
COMMENT ON FUNCTION determine_lead_source_from_attribution(JSONB) IS 'Intelligently determines lead source from attribution data';
COMMENT ON FUNCTION set_lead_source_from_attribution() IS 'Trigger function to automatically set UTM fields and lead_source from attribution_data';