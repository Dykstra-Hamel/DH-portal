-- Update the auto_create_quote_for_lead function to generate quote_url path
CREATE OR REPLACE FUNCTION auto_create_quote_for_lead()
RETURNS TRIGGER AS $$
DECLARE
    company_slug_val TEXT;
    new_quote_id UUID;
BEGIN
    -- Generate a new UUID for the quote
    new_quote_id := gen_random_uuid();

    -- Fetch the company slug
    SELECT slug INTO company_slug_val
    FROM companies
    WHERE id = NEW.company_id;

    -- Create quote for new lead with quote_url path
    INSERT INTO quotes (
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
        NEW.pest_type,  -- Copy initial value from lead
        COALESCE(NEW.additional_pests, ARRAY[]::TEXT[]),  -- Copy or empty array
        NULL,  -- Will be set when user selects size
        NULL,  -- Will be set when user selects size
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
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION auto_create_quote_for_lead() IS 'Automatically creates a draft quote with quote_url path whenever a new lead is inserted';
