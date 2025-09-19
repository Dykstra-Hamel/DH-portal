-- Create support_cases table for pest control customer service operations
CREATE TABLE IF NOT EXISTS support_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    
    -- Pest control specific issue types
    issue_type VARCHAR(50) CHECK (issue_type IN ('billing', 'scheduling', 'complaint', 'service_quality', 'treatment_request', 're_service', 'general_inquiry', 'warranty_claim')),
    summary VARCHAR(255),
    description TEXT,
    resolution_action TEXT,
    notes TEXT,
    
    -- Workflow and assignment
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'awaiting_customer', 'awaiting_internal', 'resolved', 'closed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Priority and tracking
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    first_response_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Customer satisfaction
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    satisfaction_feedback TEXT,
    satisfaction_collected_at TIMESTAMP WITH TIME ZONE,
    
    -- Standard fields
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_support_cases_company_id ON support_cases(company_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_customer_id ON support_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_ticket_id ON support_cases(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_status ON support_cases(status);
CREATE INDEX IF NOT EXISTS idx_support_cases_issue_type ON support_cases(issue_type);
CREATE INDEX IF NOT EXISTS idx_support_cases_assigned_to ON support_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_cases_priority ON support_cases(priority);
CREATE INDEX IF NOT EXISTS idx_support_cases_created_at ON support_cases(created_at);
CREATE INDEX IF NOT EXISTS idx_support_cases_resolved_at ON support_cases(resolved_at);
CREATE INDEX IF NOT EXISTS idx_support_cases_archived ON support_cases(archived);

-- Create updated_at trigger
CREATE TRIGGER update_support_cases_updated_at
    BEFORE UPDATE ON support_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE support_cases ENABLE ROW LEVEL SECURITY;

-- Create policies for support_cases table
CREATE POLICY "Allow authenticated users to view support cases" ON support_cases
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert support cases" ON support_cases
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update support cases" ON support_cases
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete support cases" ON support_cases
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger function to automatically set timestamps
CREATE OR REPLACE FUNCTION set_support_case_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Set resolved_at when status changes to resolved
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = NOW();
    ELSIF NEW.status != 'resolved' THEN
        NEW.resolved_at = NULL;
    END IF;
    
    -- Set closed_at when status changes to closed
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        NEW.closed_at = NOW();
    ELSIF NEW.status != 'closed' THEN
        NEW.closed_at = NULL;
    END IF;
    
    -- Set first_response_at when first assigned or status changes from new
    IF NEW.assigned_to IS NOT NULL AND OLD.assigned_to IS NULL AND NEW.first_response_at IS NULL THEN
        NEW.first_response_at = NOW();
    ELSIF NEW.status != 'new' AND OLD.status = 'new' AND NEW.first_response_at IS NULL THEN
        NEW.first_response_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set timestamps
CREATE TRIGGER trigger_set_support_case_timestamps
    BEFORE INSERT OR UPDATE ON support_cases
    FOR EACH ROW
    EXECUTE FUNCTION set_support_case_timestamps();

-- Add helpful comments for documentation
COMMENT ON TABLE support_cases IS 'Support cases table for pest control customer service operations';
COMMENT ON COLUMN support_cases.ticket_id IS 'Reference to the originating ticket that created this support case';
COMMENT ON COLUMN support_cases.issue_type IS 'Type of pest control customer service issue';
COMMENT ON COLUMN support_cases.summary IS 'Brief title/summary of the support case';
COMMENT ON COLUMN support_cases.description IS 'Detailed description of the customer issue';
COMMENT ON COLUMN support_cases.resolution_action IS 'Action taken to resolve the support case';
COMMENT ON COLUMN support_cases.notes IS 'General notes and comments about the case';
COMMENT ON COLUMN support_cases.status IS 'Current status of the support case workflow';
COMMENT ON COLUMN support_cases.first_response_at IS 'Timestamp when case was first responded to';
COMMENT ON COLUMN support_cases.resolved_at IS 'Timestamp when case was marked as resolved';
COMMENT ON COLUMN support_cases.closed_at IS 'Timestamp when case was closed';
COMMENT ON COLUMN support_cases.satisfaction_rating IS 'Customer satisfaction rating from 1-5';
COMMENT ON COLUMN support_cases.archived IS 'Soft delete flag - archived cases are hidden from main views but preserved in database';