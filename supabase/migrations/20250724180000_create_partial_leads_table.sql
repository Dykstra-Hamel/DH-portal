-- Create partial_leads table for storing incomplete form submissions
CREATE TABLE IF NOT EXISTS partial_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    session_id UUID NOT NULL UNIQUE,
    form_data JSONB NOT NULL DEFAULT '{}',
    step_completed VARCHAR(50) NOT NULL DEFAULT 'address_validated',
    service_area_data JSONB NOT NULL DEFAULT '{}',
    attribution_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days') NOT NULL,
    converted_to_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_partial_leads_company_id ON partial_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_partial_leads_session_id ON partial_leads(session_id);
CREATE INDEX IF NOT EXISTS idx_partial_leads_created_at ON partial_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_partial_leads_expires_at ON partial_leads(expires_at);
CREATE INDEX IF NOT EXISTS idx_partial_leads_step_completed ON partial_leads(step_completed);
CREATE INDEX IF NOT EXISTS idx_partial_leads_converted_to_lead_id ON partial_leads(converted_to_lead_id);

-- Create GIN index for JSONB columns for efficient queries
CREATE INDEX IF NOT EXISTS idx_partial_leads_form_data_gin ON partial_leads USING GIN(form_data);
CREATE INDEX IF NOT EXISTS idx_partial_leads_service_area_data_gin ON partial_leads USING GIN(service_area_data);
CREATE INDEX IF NOT EXISTS idx_partial_leads_attribution_data_gin ON partial_leads USING GIN(attribution_data);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partial_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS trigger_update_partial_leads_updated_at ON partial_leads;
CREATE TRIGGER trigger_update_partial_leads_updated_at
    BEFORE UPDATE ON partial_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_partial_leads_updated_at();

-- Add RLS policies for row-level security
ALTER TABLE partial_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Companies can only access their own partial leads
CREATE POLICY "Companies can view their own partial leads" ON partial_leads
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Companies can insert their own partial leads" ON partial_leads
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Companies can update their own partial leads" ON partial_leads
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ));

-- Service role policy for widget submissions (bypasses RLS)
CREATE POLICY "Service role full access" ON partial_leads
    FOR ALL USING (auth.role() = 'service_role');

-- Add helpful comments for documentation
COMMENT ON TABLE partial_leads IS 'Stores incomplete widget form submissions for lead nurturing and conversion tracking';
COMMENT ON COLUMN partial_leads.session_id IS 'Unique session identifier for tracking user journey across pages';
COMMENT ON COLUMN partial_leads.form_data IS 'JSON object containing all captured form data (address, pest issue, contact info)';
COMMENT ON COLUMN partial_leads.step_completed IS 'Furthest step completed: address_validated, contact_started, etc.';
COMMENT ON COLUMN partial_leads.service_area_data IS 'Service area validation results and matched areas';
COMMENT ON COLUMN partial_leads.attribution_data IS 'UTM parameters, GCLID, referrer data, and traffic source intelligence';
COMMENT ON COLUMN partial_leads.expires_at IS 'Automatic cleanup date for data retention compliance';
COMMENT ON COLUMN partial_leads.converted_to_lead_id IS 'Links to full lead record if user completes form later';