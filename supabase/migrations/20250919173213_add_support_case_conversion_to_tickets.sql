-- Add support case conversion tracking to tickets table
-- This enables proper archival of tickets when converted to support cases

-- Add the converted_to_support_case_id field to track reverse relationship
ALTER TABLE tickets ADD COLUMN converted_to_support_case_id UUID REFERENCES support_cases(id) ON DELETE SET NULL;

-- Create index for performance on the new field
CREATE INDEX IF NOT EXISTS idx_tickets_converted_to_support_case ON tickets(converted_to_support_case_id);

-- Add constraint to ensure a ticket can only be converted to one type (lead OR support case, not both)
ALTER TABLE tickets ADD CONSTRAINT chk_single_conversion_type 
CHECK (
  (converted_to_lead_id IS NULL OR converted_to_support_case_id IS NULL)
);

-- Create unique constraint to ensure each support case is only linked to one ticket
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_unique_support_case_conversion 
ON tickets(converted_to_support_case_id) 
WHERE converted_to_support_case_id IS NOT NULL;

-- Add helpful comments for documentation
COMMENT ON COLUMN tickets.converted_to_support_case_id IS 'Reference to support case created from this ticket during customer service qualification';

-- Update the existing trigger function to handle support case conversions
CREATE OR REPLACE FUNCTION validate_ticket_conversion()
RETURNS TRIGGER AS $$
BEGIN
    -- Existing lead conversion validation
    IF NEW.converted_to_lead_id IS NOT NULL THEN
        -- Verify the referenced lead exists and has the correct ticket reference
        IF NOT EXISTS (
            SELECT 1 FROM leads 
            WHERE id = NEW.converted_to_lead_id 
            AND converted_from_ticket_id = NEW.id
        ) THEN
            RAISE EXCEPTION 'Invalid lead conversion: lead must exist and reference this ticket';
        END IF;
    END IF;
    
    -- New support case conversion validation
    IF NEW.converted_to_support_case_id IS NOT NULL THEN
        -- Verify the referenced support case exists and has the correct ticket reference
        IF NOT EXISTS (
            SELECT 1 FROM support_cases 
            WHERE id = NEW.converted_to_support_case_id 
            AND ticket_id = NEW.id
        ) THEN
            RAISE EXCEPTION 'Invalid support case conversion: support case must exist and reference this ticket';
        END IF;
    END IF;
    
    -- If converted_at is set, ensure either converted_to_lead_id or converted_to_support_case_id is also set
    IF NEW.converted_at IS NOT NULL AND NEW.converted_to_lead_id IS NULL AND NEW.converted_to_support_case_id IS NULL THEN
        RAISE EXCEPTION 'converted_at requires either converted_to_lead_id or converted_to_support_case_id to be set';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use the new function name
DROP TRIGGER IF EXISTS validate_ticket_conversion_trigger ON tickets;
CREATE TRIGGER validate_ticket_conversion_trigger
    BEFORE INSERT OR UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION validate_ticket_conversion();