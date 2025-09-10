-- Add missing attribution fields to tickets table
-- This ensures the tickets table has all the same attribution fields as leads

-- Add fbclid column for Facebook attribution tracking
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fbclid VARCHAR(255);

-- Add landing_page_url column if not exists (it should already exist but checking)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS landing_page_url TEXT;

-- Create indexes for the new attribution fields
CREATE INDEX IF NOT EXISTS idx_tickets_fbclid ON tickets(fbclid);
CREATE INDEX IF NOT EXISTS idx_tickets_landing_page_url ON tickets(landing_page_url);

-- Update the attribution trigger function to handle fbclid
CREATE OR REPLACE FUNCTION set_ticket_source_from_attribution()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-set source if it's not already set and we have attribution data
    IF (NEW.source IS NULL OR NEW.source = 'other') AND NEW.attribution_data IS NOT NULL THEN
        NEW.source = determine_ticket_source_from_attribution(NEW.attribution_data);
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
    
    -- Extract fbclid from attribution_data if not already set
    IF NEW.fbclid IS NULL AND NEW.attribution_data ? 'fbclid' THEN
        NEW.fbclid = NEW.attribution_data->>'fbclid';
    END IF;
    
    -- Set resolved_at when status changes to resolved or closed
    IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
        NEW.resolved_at = NOW();
    ELSIF NEW.status NOT IN ('resolved', 'closed') THEN
        NEW.resolved_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments for documentation
COMMENT ON COLUMN tickets.fbclid IS 'Facebook click ID for attribution tracking';
COMMENT ON COLUMN tickets.landing_page_url IS 'URL of the page where the user first landed before creating the ticket';