-- Remove title field from tickets table and add conversion tracking fields
-- This migration implements the ticket-to-lead conversion system

-- First, remove the title column from tickets table
ALTER TABLE tickets DROP COLUMN IF EXISTS title;

-- Add conversion tracking fields to tickets table
ALTER TABLE tickets ADD COLUMN converted_to_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN converted_to_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE;

-- Add source tracking to leads table
ALTER TABLE leads ADD COLUMN converted_from_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL;

-- Add source tracking to customers table
ALTER TABLE customers ADD COLUMN created_from_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL;

-- Create indexes for conversion tracking
CREATE INDEX IF NOT EXISTS idx_tickets_converted_to_lead ON tickets(converted_to_lead_id);
CREATE INDEX IF NOT EXISTS idx_tickets_converted_to_customer ON tickets(converted_to_customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_converted_at ON tickets(converted_at);
CREATE INDEX IF NOT EXISTS idx_leads_converted_from_ticket ON leads(converted_from_ticket_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_from_ticket ON customers(created_from_ticket_id);

-- Add helpful comments for documentation
COMMENT ON COLUMN tickets.converted_to_lead_id IS 'Reference to lead created from this ticket during conversion';
COMMENT ON COLUMN tickets.converted_to_customer_id IS 'Reference to customer created from this ticket during conversion (if no customer existed)';
COMMENT ON COLUMN tickets.converted_at IS 'Timestamp when ticket was converted to lead';
COMMENT ON COLUMN leads.converted_from_ticket_id IS 'Reference to original ticket that was converted to create this lead';
COMMENT ON COLUMN customers.created_from_ticket_id IS 'Reference to ticket that triggered customer creation during conversion';

-- Create function to validate conversion integrity
CREATE OR REPLACE FUNCTION validate_ticket_conversion()
RETURNS TRIGGER AS $$
BEGIN
    -- If ticket is marked as converted to lead, ensure lead exists and references back
    IF NEW.converted_to_lead_id IS NOT NULL THEN
        -- Check that the lead exists and references this ticket
        IF NOT EXISTS (
            SELECT 1 FROM leads 
            WHERE id = NEW.converted_to_lead_id 
            AND converted_from_ticket_id = NEW.id
        ) THEN
            RAISE EXCEPTION 'Invalid conversion: lead does not exist or does not reference this ticket';
        END IF;
        
        -- Ensure converted_at is set
        IF NEW.converted_at IS NULL THEN
            NEW.converted_at = NOW();
        END IF;
    END IF;
    
    -- If converted_at is set, ensure converted_to_lead_id is also set
    IF NEW.converted_at IS NOT NULL AND NEW.converted_to_lead_id IS NULL THEN
        RAISE EXCEPTION 'Invalid conversion state: converted_at is set but no lead reference';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate conversion integrity
CREATE TRIGGER trigger_validate_ticket_conversion
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION validate_ticket_conversion();

-- Add constraint to ensure conversion integrity
-- A ticket can only be converted once (converted_to_lead_id should be unique when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_unique_conversion 
ON tickets(converted_to_lead_id) 
WHERE converted_to_lead_id IS NOT NULL;

-- Add helpful function to get ticket display name (since we removed title)
CREATE OR REPLACE FUNCTION get_ticket_display_name(ticket_row tickets)
RETURNS TEXT AS $$
BEGIN
    -- If ticket has customer, use customer name
    IF ticket_row.customer_id IS NOT NULL THEN
        DECLARE
            customer_name TEXT;
        BEGIN
            SELECT CONCAT(first_name, ' ', last_name, '''s Ticket')
            INTO customer_name
            FROM customers
            WHERE id = ticket_row.customer_id;
            
            IF customer_name IS NOT NULL THEN
                RETURN customer_name;
            END IF;
        END;
    END IF;
    
    -- Use ticket type + creation date
    IF ticket_row.type IS NOT NULL THEN
        RETURN CONCAT(
            CASE ticket_row.type
                WHEN 'phone_call' THEN 'Phone Call'
                WHEN 'web_form' THEN 'Web Form'
                WHEN 'email' THEN 'Email'
                WHEN 'chat' THEN 'Chat'
                WHEN 'internal_task' THEN 'Internal Task'
                ELSE INITCAP(REPLACE(ticket_row.type, '_', ' '))
            END,
            ' - ',
            TO_CHAR(ticket_row.created_at, 'Mon DD')
        );
    END IF;
    
    -- Fallback to ticket ID
    RETURN CONCAT('Ticket #', SUBSTRING(ticket_row.id::TEXT, 1, 8));
END;
$$ LANGUAGE plpgsql IMMUTABLE;