-- Create form_submissions table for flexible form data storage
-- Supports both JSON and form-urlencoded submissions with Gemini AI normalization

CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

    -- Source tracking
    source_url TEXT, -- Full URL where form was submitted from
    source_domain VARCHAR(255), -- Extracted domain for quick filtering

    -- Form data storage
    raw_payload JSONB NOT NULL, -- Original form data (converted to JSON regardless of content-type)
    normalized_data JSONB, -- Gemini-parsed structured data matching expected schema
    content_type VARCHAR(100), -- 'application/json' or 'application/x-www-form-urlencoded'

    -- AI processing metadata
    gemini_confidence DECIMAL(3,2), -- Confidence score 0.00-1.00
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed')),
    processing_error TEXT, -- Store error message if processing fails

    -- Technical tracking
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    processed_at TIMESTAMP WITH TIME ZONE, -- When Gemini processing completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_company_id ON form_submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_ticket_id ON form_submissions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_customer_id ON form_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_source_domain ON form_submissions(source_domain);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_processing_status ON form_submissions(processing_status);

-- Create GIN indexes for JSONB columns for efficient queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_raw_payload_gin ON form_submissions USING GIN(raw_payload);
CREATE INDEX IF NOT EXISTS idx_form_submissions_normalized_data_gin ON form_submissions USING GIN(normalized_data);

-- Create updated_at trigger
CREATE TRIGGER update_form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for form_submissions table
CREATE POLICY "Allow authenticated users to view form submissions" ON form_submissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow service role to insert form submissions" ON form_submissions
    FOR INSERT WITH CHECK (true); -- Service role bypasses RLS, authenticated users can insert

CREATE POLICY "Allow authenticated users to update form submissions" ON form_submissions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete form submissions" ON form_submissions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add helpful comments for documentation
COMMENT ON TABLE form_submissions IS 'Stores all form submissions with both raw and AI-normalized data. Supports multiple content types and flexible field mapping via Gemini AI.';
COMMENT ON COLUMN form_submissions.raw_payload IS 'Original form data as received, converted to JSONB regardless of content-type';
COMMENT ON COLUMN form_submissions.normalized_data IS 'Gemini AI-parsed data matching standardized schema (first_name, last_name, email, phone_number, address fields, pest_issue, own_or_rent, additional_comments)';
COMMENT ON COLUMN form_submissions.content_type IS 'HTTP Content-Type of the original request (application/json or application/x-www-form-urlencoded)';
COMMENT ON COLUMN form_submissions.gemini_confidence IS 'AI confidence score for the normalization quality (0.00 = low, 1.00 = high)';
COMMENT ON COLUMN form_submissions.processing_status IS 'Status of AI processing: pending (just received), processed (Gemini completed), failed (error during processing)';
