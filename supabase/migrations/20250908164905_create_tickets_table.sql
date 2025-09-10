-- Create tickets table
-- Mirror of leads table structure but with simplified field names and enhanced for tickets
CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- Optional for internal tickets
    
    -- Simplified field names (removed "lead_" prefix)
    source VARCHAR(50) CHECK (source IN ('organic', 'referral', 'google_cpc', 'facebook_ads', 'linkedin', 'email_campaign', 'cold_call', 'trade_show', 'webinar', 'content_marketing', 'internal', 'other')),
    type VARCHAR(50) CHECK (type IN ('phone_call', 'web_form', 'email', 'chat', 'social_media', 'in_person', 'internal_task', 'bug_report', 'feature_request', 'other')),
    service_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'quoted', 'in_progress', 'resolved', 'closed', 'won', 'lost', 'unqualified')),
    
    -- Ticket-specific fields
    title VARCHAR(255), -- Enhanced from just comments
    description TEXT, -- Renamed from comments for clarity
    
    -- Assignment and tracking
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    next_follow_up_at TIMESTAMP WITH TIME ZONE,
    estimated_value DECIMAL(10,2),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Service-specific fields
    pest_type VARCHAR(255),
    
    -- Enhanced ticket tracking
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Attribution tracking (same as leads)
    partial_lead_id UUID REFERENCES partial_leads(id) ON DELETE SET NULL,
    gclid VARCHAR(255),
    attribution_data JSONB DEFAULT '{}',
    
    -- UTM tracking
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    
    -- Technical tracking
    referrer_url TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tickets_company_id ON tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_source ON tickets(source);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_next_follow_up ON tickets(next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_pest_type ON tickets(pest_type);
CREATE INDEX IF NOT EXISTS idx_tickets_archived ON tickets(archived);

-- Attribution tracking indexes
CREATE INDEX IF NOT EXISTS idx_tickets_partial_lead_id ON tickets(partial_lead_id);
CREATE INDEX IF NOT EXISTS idx_tickets_gclid ON tickets(gclid);
CREATE INDEX IF NOT EXISTS idx_tickets_utm_source ON tickets(utm_source);
CREATE INDEX IF NOT EXISTS idx_tickets_utm_medium ON tickets(utm_medium);
CREATE INDEX IF NOT EXISTS idx_tickets_utm_campaign ON tickets(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON tickets(resolved_at);

-- Create GIN index for JSONB attribution_data column for efficient queries
CREATE INDEX IF NOT EXISTS idx_tickets_attribution_data_gin ON tickets USING GIN(attribution_data);

-- Create updated_at trigger
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets table (mirror leads policies)
CREATE POLICY "Allow authenticated users to view tickets" ON tickets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert tickets" ON tickets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update tickets" ON tickets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete tickets" ON tickets
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to determine ticket source from attribution (adapted from leads)
CREATE OR REPLACE FUNCTION determine_ticket_source_from_attribution(attribution JSONB)
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
    
    -- Determine source based on attribution data
    IF gclid_value IS NOT NULL OR (utm_source = 'google' AND utm_medium = 'cpc') THEN
        RETURN 'google_cpc';
    ELSIF utm_source = 'facebook' AND utm_medium IN ('paid', 'cpc', 'ads') THEN
        RETURN 'facebook_ads';
    ELSIF utm_source = 'linkedin' THEN
        RETURN 'linkedin';
    ELSIF utm_source = 'bing' AND utm_medium = 'cpc' THEN
        RETURN 'referral'; -- Map to referral as bing_cpc not in enum
    ELSIF traffic_source = 'organic' THEN
        RETURN 'organic';
    ELSIF traffic_source = 'social' OR referrer_domain IN ('facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com') THEN
        RETURN 'other'; -- social_media not in source enum, map to other
    ELSIF traffic_source = 'referral' THEN
        RETURN 'referral';
    ELSIF traffic_source = 'direct' THEN
        RETURN 'other';
    ELSIF traffic_source = 'internal' THEN
        RETURN 'internal';
    ELSE
        RETURN 'other';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger function to automatically set source based on attribution data
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
    
    -- Set resolved_at when status changes to resolved or closed
    IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
        NEW.resolved_at = NOW();
    ELSIF NEW.status NOT IN ('resolved', 'closed') THEN
        NEW.resolved_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set attribution fields
CREATE TRIGGER trigger_set_ticket_attribution
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION set_ticket_source_from_attribution();

-- Add helpful comments for documentation
COMMENT ON TABLE tickets IS 'Tickets table for tracking all customer interactions and internal tasks';
COMMENT ON COLUMN tickets.customer_id IS 'Optional customer reference - can be NULL for internal tickets';
COMMENT ON COLUMN tickets.source IS 'How the ticket originated (simplified from lead_source)';
COMMENT ON COLUMN tickets.type IS 'Type of interaction or ticket (simplified from lead_type)';
COMMENT ON COLUMN tickets.status IS 'Current status of ticket (simplified from lead_status)';
COMMENT ON COLUMN tickets.title IS 'Brief title/summary of the ticket';
COMMENT ON COLUMN tickets.description IS 'Detailed description of the ticket (renamed from comments)';
COMMENT ON COLUMN tickets.resolved_at IS 'Timestamp when ticket was marked as resolved or closed';
COMMENT ON COLUMN tickets.attribution_data IS 'Complete attribution context including referrer, traffic source, and session data';
COMMENT ON COLUMN tickets.archived IS 'Soft delete flag - archived tickets are hidden from main views but preserved in database';