-- Fix the ensure_call_record_customer_id trigger function to respect company boundaries
-- This function was causing constraint violations by finding customers from wrong companies

-- The issue: The trigger was looking up customers by phone number across all companies,
-- then trying to assign that customer_id to a call record that already had the correct
-- customer_id for the correct company, causing unique constraint violations.

CREATE OR REPLACE FUNCTION public.ensure_call_record_customer_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    existing_customer_id UUID;
    lead_company_id UUID;
BEGIN
    -- If lead_id is provided but customer_id is missing, populate it from the lead
    IF NEW.lead_id IS NOT NULL AND NEW.customer_id IS NULL THEN
        SELECT customer_id INTO NEW.customer_id 
        FROM public.leads 
        WHERE id = NEW.lead_id;
    END IF;
    
    -- If still no customer_id and we have a phone number, try to find customer by phone
    -- BUT respect company boundaries to avoid constraint violations
    IF NEW.customer_id IS NULL AND NEW.phone_number IS NOT NULL THEN
        -- First, try to get company_id from the associated lead
        IF NEW.lead_id IS NOT NULL THEN
            SELECT company_id INTO lead_company_id
            FROM public.leads 
            WHERE id = NEW.lead_id;
        END IF;
        
        -- If we have a company context, search within that company only
        IF lead_company_id IS NOT NULL THEN
            SELECT id INTO existing_customer_id
            FROM public.customers 
            WHERE phone = NEW.phone_number 
            AND company_id = lead_company_id
            LIMIT 1;
        ELSE
            -- Fallback: search across all companies but prefer active customers
            -- This should rarely happen since leads should always have company_id
            SELECT id INTO existing_customer_id
            FROM public.customers 
            WHERE phone = NEW.phone_number 
            AND customer_status = 'active'
            ORDER BY created_at DESC
            LIMIT 1;
        END IF;
        
        IF existing_customer_id IS NOT NULL THEN
            NEW.customer_id = existing_customer_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Add comment explaining the fix
COMMENT ON FUNCTION public.ensure_call_record_customer_id() IS 'Ensures call records have customer_id populated while respecting company boundaries to prevent constraint violations. Fixed 2025-08-20 to address Retell webhook failures.';