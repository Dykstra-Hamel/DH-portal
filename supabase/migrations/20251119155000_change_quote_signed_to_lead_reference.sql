-- Change quote_signed notifications to reference the lead instead of the quote
-- This allows both email and in-app notifications to route to the lead page
-- The frontend already has routing logic for 'lead' reference type

-- Drop and recreate the function with lead reference
DROP FUNCTION IF EXISTS notify_quote_signed() CASCADE;

CREATE OR REPLACE FUNCTION notify_quote_signed()
RETURNS TRIGGER AS $$
DECLARE
    v_lead RECORD;
    v_customer RECORD;
    v_company RECORD;
    v_quote_total NUMERIC;
BEGIN
    -- Only proceed if the quote was just signed (signed_at changed from NULL to a value)
    IF NEW.signed_at IS NOT NULL AND (OLD.signed_at IS NULL OR OLD.signed_at != NEW.signed_at) THEN
        -- Get the lead and assigned user information
        SELECT id, assigned_to, company_id, service_type
        INTO v_lead
        FROM leads
        WHERE id = NEW.lead_id;

        -- Only notify if the lead has an assigned user
        IF v_lead.assigned_to IS NOT NULL THEN
            -- Get customer information
            SELECT
                COALESCE(c.first_name || ' ' || c.last_name, c.email, 'Customer') as customer_name,
                c.email as customer_email
            INTO v_customer
            FROM customers c
            JOIN leads l ON l.customer_id = c.id
            WHERE l.id = v_lead.id;

            -- Get company information
            SELECT name
            INTO v_company
            FROM companies
            WHERE id = v_lead.company_id;

            -- Calculate quote total from final prices (discounts already applied)
            SELECT COALESCE(SUM(qli.final_initial_price), 0) INTO v_quote_total
            FROM quote_line_items qli
            WHERE qli.quote_id = NEW.id;

            -- Create notification for assigned user and managers
            -- CHANGED: Now passes v_lead.id instead of NEW.id (quote id)
            -- CHANGED: reference_type is now 'lead' instead of 'quote'
            PERFORM notify_assigned_and_managers(
                v_lead.company_id,
                v_lead.assigned_to,
                'quote_signed',
                'Quote Accepted - ' || v_customer.customer_name,
                v_customer.customer_name || ' has accepted a quote for $' ||
                    TO_CHAR(v_quote_total, 'FM999,999,990.00') ||
                    '. Please follow up to schedule the service.',
                v_lead.id,     -- Changed from NEW.id (quote) to v_lead.id (lead)
                'lead'         -- Changed from 'quote' to 'lead'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (was dropped by CASCADE above)
DROP TRIGGER IF EXISTS trigger_quote_signed ON quotes;
CREATE TRIGGER trigger_quote_signed
    AFTER UPDATE OF signed_at ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION notify_quote_signed();

-- Add documentation comments
COMMENT ON FUNCTION notify_quote_signed() IS 'Creates in-app notifications when a quote is signed/accepted by a customer. Notifications reference the lead (not the quote) so users are routed to the lead page.';
COMMENT ON TRIGGER trigger_quote_signed ON quotes IS 'Triggers notification when a quote is signed';
