-- Fix: qualify-ticket "relation companies does not exist" regression
-- The auto_create_quote_for_lead trigger function queries companies without a
-- schema prefix and without a pinned search_path, causing 42P01 in some
-- execution contexts introduced by recent RLS migrations.

CREATE OR REPLACE FUNCTION public.auto_create_quote_for_lead()
RETURNS TRIGGER AS $$
DECLARE
    company_slug_val TEXT;
    new_quote_id UUID;
BEGIN
    new_quote_id := gen_random_uuid();

    -- Use schema-qualified reference; handle missing slug gracefully
    BEGIN
        SELECT slug INTO company_slug_val
        FROM public.companies
        WHERE id = NEW.company_id;
    EXCEPTION WHEN OTHERS THEN
        company_slug_val := NULL;
    END;

    INSERT INTO public.quotes (
        id,
        lead_id,
        company_id,
        customer_id,
        service_address_id,
        primary_pest,
        additional_pests,
        home_size_range,
        yard_size_range,
        total_initial_price,
        total_recurring_price,
        quote_status,
        quote_url
    ) VALUES (
        new_quote_id,
        NEW.id,
        NEW.company_id,
        NEW.customer_id,
        NEW.service_address_id,
        NEW.pest_type,
        COALESCE(NEW.additional_pests, ARRAY[]::TEXT[]),
        NULL,
        NULL,
        0.00,
        0.00,
        'draft',
        CASE
            WHEN company_slug_val IS NOT NULL
            THEN '/' || company_slug_val || '/quote/' || new_quote_id::TEXT
            ELSE NULL
        END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp';

COMMENT ON FUNCTION public.auto_create_quote_for_lead() IS
  'Automatically creates a draft quote with quote_url path whenever a new lead is inserted. SECURITY DEFINER + pinned search_path prevents 42P01 on companies lookup.';
