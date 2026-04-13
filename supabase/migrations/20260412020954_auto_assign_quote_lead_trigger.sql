-- Auto-assign custom quote leads via DB trigger
-- Fires BEFORE INSERT on leads, so it works for every lead-creation code path.
-- Resolves zip from service_addresses first, then customers as fallback.

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

  -- Resolve zip: service address first, then customer fallback
  IF NEW.service_address_id IS NOT NULL THEN
    SELECT zip_code INTO v_zip FROM service_addresses WHERE id = NEW.service_address_id;
  END IF;
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

CREATE TRIGGER trg_auto_assign_quote_lead
  BEFORE INSERT ON leads
  FOR EACH ROW EXECUTE FUNCTION auto_assign_quote_lead();
