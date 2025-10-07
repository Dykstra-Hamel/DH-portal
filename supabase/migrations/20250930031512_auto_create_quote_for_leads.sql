-- Create function to automatically create a quote when a lead is created
CREATE OR REPLACE FUNCTION auto_create_quote_for_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Create quote for new lead
    INSERT INTO quotes (
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
        quote_status
    ) VALUES (
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
        'draft'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create quote after lead insertion
CREATE TRIGGER trigger_auto_create_quote
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_quote_for_lead();

-- Add comment for documentation
COMMENT ON FUNCTION auto_create_quote_for_lead() IS 'Automatically creates a draft quote whenever a new lead is inserted';