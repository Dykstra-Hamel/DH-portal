-- Seed data for testing Pest Pressure Prediction System locally
-- This creates realistic test data with historical patterns

-- Get a test company (adjust this ID to match your local company)
-- You can find your company ID by running: SELECT id, name FROM companies LIMIT 5;
DO $$
DECLARE
  test_company_id UUID;
  test_lead_id UUID;
  test_ticket_id UUID;
  test_call_id UUID;
  test_form_id UUID;
  test_customer_id UUID;
  current_date DATE := CURRENT_DATE;
  i INT;
  pest_types TEXT[] := ARRAY['ants', 'termites', 'roaches', 'mosquitoes', 'spiders', 'mice', 'bed bugs', 'fleas'];
  cities TEXT[] := ARRAY['Atlanta', 'Austin', 'Phoenix', 'Miami', 'Dallas'];
  states TEXT[] := ARRAY['GA', 'TX', 'AZ', 'FL', 'TX'];
  base_lat DECIMAL[] := ARRAY[33.7490, 30.2672, 33.4484, 25.7617, 32.7767];
  base_lng DECIMAL[] := ARRAY[-84.3880, -97.7431, -112.0740, -80.1918, -96.7970];
BEGIN
  -- Get first active company
  SELECT id INTO test_company_id FROM companies WHERE is_active = TRUE LIMIT 1;

  IF test_company_id IS NULL THEN
    RAISE NOTICE 'No active company found. Please create a company first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using company: %', test_company_id;

  -- Get or create a test customer
  SELECT id INTO test_customer_id
  FROM customers
  WHERE company_id = test_company_id
  LIMIT 1;

  IF test_customer_id IS NULL THEN
    INSERT INTO customers (company_id, name, email, phone, city, state, zip_code)
    VALUES (
      test_company_id,
      'Test Customer',
      'test@example.com',
      '555-0100',
      'Atlanta',
      'GA',
      '30301'
    )
    RETURNING id INTO test_customer_id;
    RAISE NOTICE 'Created test customer: %', test_customer_id;
  END IF;

  -- Create 90 days of historical pest pressure data points
  -- This simulates realistic seasonal patterns
  FOR i IN 0..89 LOOP
    DECLARE
      observation_date TIMESTAMPTZ := current_date - (90 - i) * INTERVAL '1 day';
      month INT := EXTRACT(MONTH FROM observation_date);
      city_idx INT := (i % 5) + 1;
      pest_idx INT := (i % 8) + 1;
      pest_type TEXT := pest_types[pest_idx];
      city TEXT := cities[city_idx];
      state TEXT := states[city_idx];
      lat DECIMAL := base_lat[city_idx] + (random() * 0.1 - 0.05);
      lng DECIMAL := base_lng[city_idx] + (random() * 0.1 - 0.05);
      -- Create seasonal pattern (higher in summer months)
      seasonal_factor DECIMAL := CASE
        WHEN month IN (6, 7, 8) THEN 1.5  -- Summer peak
        WHEN month IN (4, 5, 9) THEN 1.2  -- Spring/Fall moderate
        ELSE 0.8  -- Winter low
      END;
      urgency INT := FLOOR(3 + random() * 5 * seasonal_factor)::INT; -- 3-8 range with seasonal variation
    BEGIN
      -- Create via call record → ticket → lead flow (most realistic)
      IF i % 3 = 0 THEN
        -- Create call record
        INSERT INTO call_records (
          company_id,
          call_id,
          phone_number,
          from_number,
          call_status,
          disconnect_reason,
          duration_seconds,
          start_timestamp,
          end_timestamp,
          transcript,
          sentiment,
          created_at
        ) VALUES (
          test_company_id,
          'test_call_' || i || '_' || extract(epoch from observation_date)::text,
          '555-01' || LPAD(i::TEXT, 2, '0'),
          '555-0200',
          'completed',
          'user_hangup',
          FLOOR(120 + random() * 300)::INT,
          observation_date,
          observation_date + INTERVAL '3 minutes',
          'Customer called about ' || pest_type || ' infestation. Mentioned seeing multiple pests in the ' ||
          CASE WHEN random() > 0.5 THEN 'kitchen' ELSE 'bathroom' END ||
          '. Urgency level ' || urgency || '/10.',
          CASE WHEN random() > 0.3 THEN 'positive' ELSE 'neutral' END,
          observation_date
        ) RETURNING id INTO test_call_id;

        -- Create ticket from call
        INSERT INTO tickets (
          company_id,
          customer_id,
          call_record_id,
          status,
          priority,
          created_at
        ) VALUES (
          test_company_id,
          test_customer_id,
          test_call_id,
          'closed',
          CASE WHEN urgency > 7 THEN 'urgent' ELSE 'normal' END,
          observation_date
        ) RETURNING id INTO test_ticket_id;

        -- Create lead converted from ticket
        INSERT INTO leads (
          company_id,
          customer_id,
          converted_from_ticket_id,
          pest_type,
          city,
          state,
          zip_code,
          lat,
          lng,
          lead_status,
          lead_source,
          created_at
        ) VALUES (
          test_company_id,
          test_customer_id,
          test_ticket_id,
          pest_type,
          city,
          state,
          '30301',
          lat,
          lng,
          'qualified',
          'phone_call',
          observation_date
        ) RETURNING id INTO test_lead_id;

      -- Create via form submission → ticket → lead flow
      ELSIF i % 3 = 1 THEN
        -- Create form submission
        INSERT INTO form_submissions (
          widget_id,
          form_data,
          normalized_data,
          customer_id,
          created_at
        ) VALUES (
          (SELECT id FROM widgets WHERE company_id = test_company_id LIMIT 1),
          jsonb_build_object(
            'pest_issue', pest_type,
            'name', 'Test Customer',
            'email', 'test@example.com',
            'phone', '555-0100'
          ),
          jsonb_build_object(
            'pest_type', pest_type,
            'first_name', 'Test',
            'last_name', 'Customer',
            'email', 'test@example.com',
            'phone_number', '555-0100'
          ),
          test_customer_id,
          observation_date
        ) RETURNING id INTO test_form_id;

        -- Create ticket from form
        INSERT INTO tickets (
          company_id,
          customer_id,
          form_submission_id,
          status,
          priority,
          created_at
        ) VALUES (
          test_company_id,
          test_customer_id,
          test_form_id,
          'closed',
          'normal',
          observation_date
        ) RETURNING id INTO test_ticket_id;

        -- Create lead converted from ticket
        INSERT INTO leads (
          company_id,
          customer_id,
          converted_from_ticket_id,
          pest_type,
          city,
          state,
          zip_code,
          lat,
          lng,
          lead_status,
          lead_source,
          created_at
        ) VALUES (
          test_company_id,
          test_customer_id,
          test_ticket_id,
          pest_type,
          city,
          state,
          '30301',
          lat,
          lng,
          'qualified',
          'web_form',
          observation_date
        ) RETURNING id INTO test_lead_id;

      -- Create orphaned lead (direct entry, no call/form)
      ELSE
        INSERT INTO leads (
          company_id,
          customer_id,
          pest_type,
          city,
          state,
          zip_code,
          lat,
          lng,
          lead_status,
          lead_source,
          created_at
        ) VALUES (
          test_company_id,
          test_customer_id,
          pest_type,
          city,
          state,
          '30301',
          lat,
          lng,
          'qualified',
          'referral',
          observation_date
        ) RETURNING id INTO test_lead_id;
      END IF;

    END;
  END LOOP;

  RAISE NOTICE 'Created 90 days of test data (leads, calls, forms, tickets)';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run aggregation: Call the data aggregator function';
  RAISE NOTICE '2. Train models: POST to /api/ai/pest-pressure/train with companyId=%', test_company_id;
  RAISE NOTICE '3. Generate predictions: POST to /api/ai/predictions with predictionType=pest_pressure';

END $$;
