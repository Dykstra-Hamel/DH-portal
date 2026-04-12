CREATE OR REPLACE FUNCTION auto_assign_quote_lead()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_requires_quote   BOOLEAN;
  v_auto_assign      BOOLEAN;
  v_zip              TEXT;
  v_assigned_user    UUID;
BEGIN
  -- Only run when unassigned and a plan is selected
  IF NEW.assigned_to IS NOT NULL OR NEW.selected_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check plan requires a custom quote
  SELECT requires_quote INTO v_requires_quote
    FROM service_plans WHERE id = NEW.selected_plan_id;
  IF NOT COALESCE(v_requires_quote, FALSE) THEN RETURN NEW; END IF;

  -- Check company setting is enabled
  SELECT (setting_value = 'true') INTO v_auto_assign
    FROM company_settings
    WHERE company_id = NEW.company_id
      AND setting_key = 'auto_assign_custom_quote_leads';
  IF NOT COALESCE(v_auto_assign, FALSE) THEN RETURN NEW; END IF;

  -- Step 1: customer's primary linked service address (upsells always have one)
  SELECT sa.zip_code INTO v_zip
    FROM customer_service_addresses csa
    JOIN service_addresses sa ON sa.id = csa.service_address_id
    WHERE csa.customer_id = NEW.customer_id
      AND csa.is_primary_address = true
      AND sa.zip_code IS NOT NULL AND sa.zip_code != ''
    LIMIT 1;

  -- Step 2: any linked service address (most recent)
  IF v_zip IS NULL OR v_zip = '' THEN
    SELECT sa.zip_code INTO v_zip
      FROM customer_service_addresses csa
      JOIN service_addresses sa ON sa.id = csa.service_address_id
      WHERE csa.customer_id = NEW.customer_id
        AND sa.zip_code IS NOT NULL AND sa.zip_code != ''
      ORDER BY csa.created_at DESC
      LIMIT 1;
  END IF;

  -- Step 3: last resort — direct zip on customers record
  IF v_zip IS NULL OR v_zip = '' THEN
    SELECT zip_code INTO v_zip FROM customers WHERE id = NEW.customer_id;
  END IF;

  IF v_zip IS NULL OR v_zip = '' THEN RETURN NEW; END IF;

  -- Find matching zip code group
  SELECT assigned_user_id INTO v_assigned_user
    FROM zip_code_groups
    WHERE company_id = NEW.company_id
      AND zip_codes @> ARRAY[v_zip]
      AND assigned_user_id IS NOT NULL
    LIMIT 1;

  IF v_assigned_user IS NOT NULL THEN
    NEW.assigned_to := v_assigned_user;
    NEW.lead_status := CASE WHEN NEW.lead_status = 'new' OR NEW.lead_status IS NULL
                            THEN 'in_process'
                            ELSE NEW.lead_status END;
  END IF;

  RETURN NEW;
END;
$$;
-- Trigger already exists; no need to recreate it.
