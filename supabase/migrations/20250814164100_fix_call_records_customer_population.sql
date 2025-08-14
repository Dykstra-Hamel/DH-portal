-- Fix call records to ensure proper customer association for future records
-- This ensures call records remain accessible through customer relationship even when lead is deleted

-- Create a trigger function to ensure call records always have customer_id when inserted/updated
-- This ensures new call records maintain customer association
CREATE OR REPLACE FUNCTION ensure_call_record_customer_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If lead_id is provided but customer_id is missing, populate it from the lead
    IF NEW.lead_id IS NOT NULL AND NEW.customer_id IS NULL THEN
        SELECT customer_id INTO NEW.customer_id 
        FROM leads 
        WHERE id = NEW.lead_id;
    END IF;
    
    -- If still no customer_id and we have a phone number, try to find customer by phone
    IF NEW.customer_id IS NULL AND NEW.phone_number IS NOT NULL THEN
        SELECT id INTO NEW.customer_id
        FROM customers 
        WHERE phone = NEW.phone_number 
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE TRIGGER trigger_ensure_call_record_customer_id
    BEFORE INSERT OR UPDATE ON call_records
    FOR EACH ROW
    EXECUTE FUNCTION ensure_call_record_customer_id();

-- Add a comment for documentation
COMMENT ON FUNCTION ensure_call_record_customer_id() IS 'Ensures call records always have a customer_id populated, either from associated lead or by phone number lookup';