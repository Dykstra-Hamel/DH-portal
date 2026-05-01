-- Property-type-aware auto-assignment for custom-quote leads.
-- Extends the existing BEFORE INSERT trigger on leads so that when a lead has
-- a property_type set, we prefer an inspector (user_departments.department =
-- 'inspector') who owns the zip AND is tagged for that property type (or
-- 'both'). If no inspector in the zip matches, fall back to today's zip-only
-- assignment so leads still get picked up.
--
-- When the lead has property_type IS NULL, skip auto-assignment entirely so
-- the lead lands unassigned on every inspector's dashboard — either a
-- residential or commercial inspector can claim it.

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

  -- If the lead has no property_type, leave it unassigned so both residential
  -- and commercial inspectors can see it in their dashboards and claim it.
  IF NEW.property_type IS NULL THEN
    RETURN NEW;
  END IF;

  -- Preferred: zip match + inspector tagged for this property_type (or 'both')
  SELECT zg.assigned_user_id INTO v_assigned_user
    FROM zip_code_groups zg
    JOIN user_departments ud
      ON ud.user_id = zg.assigned_user_id
     AND ud.company_id = zg.company_id
     AND ud.department = 'inspector'
     AND ud.department_type IN (NEW.property_type, 'both')
    WHERE zg.company_id = NEW.company_id
      AND zg.zip_codes @> ARRAY[v_zip]
      AND zg.assigned_user_id IS NOT NULL
    LIMIT 1;

  -- Fallback: zip-only (today's behavior) so the lead still gets assigned if
  -- nobody in the zip group is tagged for this property_type.
  IF v_assigned_user IS NULL THEN
    SELECT assigned_user_id INTO v_assigned_user
      FROM zip_code_groups
      WHERE company_id = NEW.company_id
        AND zip_codes @> ARRAY[v_zip]
        AND assigned_user_id IS NOT NULL
      LIMIT 1;
  END IF;

  IF v_assigned_user IS NOT NULL THEN
    NEW.assigned_to := v_assigned_user;
    NEW.lead_status := CASE WHEN NEW.lead_status = 'new' OR NEW.lead_status IS NULL
                            THEN 'in_process'
                            ELSE NEW.lead_status END;
  END IF;

  RETURN NEW;
END;
$$;
