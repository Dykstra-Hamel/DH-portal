-- Add updated_at trigger to leads table
-- This trigger was defined in the original migration but appears to have been dropped

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
