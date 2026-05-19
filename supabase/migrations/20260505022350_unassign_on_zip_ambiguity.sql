-- Tighten auto_assign_quote_lead under the new lead-routing rules:
--
-- 1. If two or more *distinct* inspectors own the lead's zip (and match its
--    property type), leave the lead unassigned instead of arbitrarily picking
--    whichever zip_code_groups row Postgres returned first.
-- 2. Drop the property-type-blind zip-only fallback. If no inspector matches
--    the zip with a compatible department_type ('residential', 'commercial',
--    or 'both'), the lead stays unassigned — so it can show up on every
--    eligible inspector's New Leads tab for manual triage.
--
-- All other behavior (technician vs non-technician gating, requires_quote +
-- auto_assign_custom_quote_leads gates, zip normalization, branch
-- resolution, branch gate, lead_status flip to 'in_process', SECURITY
-- DEFINER, debug logging) is preserved from the previous version.

CREATE OR REPLACE FUNCTION auto_assign_quote_lead()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_requires_quote   BOOLEAN;
  v_auto_assign      BOOLEAN;
  v_zip              TEXT;
  v_assigned_user    UUID;
  v_resolved_branch  UUID;
  v_user_uba_count   INT;
  v_user_in_branch   INT;
  v_is_tech_lead     BOOLEAN;
  v_match_count      INT;
BEGIN
  INSERT INTO lead_assignment_debug (lead_id, step, detail)
  VALUES (NEW.id, 'enter', jsonb_build_object(
    'lead_source', NEW.lead_source,
    'company_id', NEW.company_id,
    'assigned_to', NEW.assigned_to,
    'service_address_id', NEW.service_address_id,
    'customer_id', NEW.customer_id,
    'branch_id', NEW.branch_id,
    'selected_plan_id', NEW.selected_plan_id,
    'property_type', NEW.property_type,
    'lead_status', NEW.lead_status
  ));

  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'bail_already_assigned', jsonb_build_object('assigned_to', NEW.assigned_to));
    RETURN NEW;
  END IF;

  v_is_tech_lead := NEW.lead_source = 'technician';

  INSERT INTO lead_assignment_debug (lead_id, step, detail)
  VALUES (NEW.id, 'classify', jsonb_build_object('is_tech_lead', v_is_tech_lead));

  IF NOT v_is_tech_lead THEN
    IF NEW.selected_plan_id IS NULL THEN
      INSERT INTO lead_assignment_debug (lead_id, step, detail)
      VALUES (NEW.id, 'bail_non_tech_no_plan', NULL);
      RETURN NEW;
    END IF;

    SELECT requires_quote INTO v_requires_quote
      FROM service_plans WHERE id = NEW.selected_plan_id;
    IF NOT COALESCE(v_requires_quote, FALSE) THEN
      INSERT INTO lead_assignment_debug (lead_id, step, detail)
      VALUES (NEW.id, 'bail_non_tech_not_custom_quote',
              jsonb_build_object('requires_quote', v_requires_quote));
      RETURN NEW;
    END IF;

    SELECT (setting_value = 'true') INTO v_auto_assign
      FROM company_settings
      WHERE company_id = NEW.company_id
        AND setting_key = 'auto_assign_custom_quote_leads';
    IF NOT COALESCE(v_auto_assign, FALSE) THEN
      INSERT INTO lead_assignment_debug (lead_id, step, detail)
      VALUES (NEW.id, 'bail_non_tech_setting_off',
              jsonb_build_object('auto_assign', v_auto_assign));
      RETURN NEW;
    END IF;
  END IF;

  IF NEW.branch_id IS NULL AND NEW.service_address_id IS NOT NULL THEN
    SELECT branch_id INTO v_resolved_branch
      FROM service_addresses
      WHERE id = NEW.service_address_id
        AND branch_resolved_at IS NOT NULL
      LIMIT 1;
    IF v_resolved_branch IS NOT NULL THEN
      NEW.branch_id := v_resolved_branch;
      INSERT INTO lead_assignment_debug (lead_id, step, detail)
      VALUES (NEW.id, 'branch_from_cached_service_address',
              jsonb_build_object('branch_id', v_resolved_branch));
    END IF;
  END IF;

  IF NEW.service_address_id IS NOT NULL THEN
    SELECT zip_code INTO v_zip FROM service_addresses WHERE id = NEW.service_address_id;
    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'zip_from_service_address', jsonb_build_object('zip', v_zip));
  END IF;
  IF v_zip IS NULL OR v_zip = '' THEN
    SELECT zip_code INTO v_zip FROM customers WHERE id = NEW.customer_id;
    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'zip_from_customer', jsonb_build_object('zip', v_zip));
  END IF;

  IF v_zip IS NOT NULL THEN
    v_zip := split_part(trim(v_zip), '-', 1);
  END IF;

  INSERT INTO lead_assignment_debug (lead_id, step, detail)
  VALUES (NEW.id, 'zip_normalized', jsonb_build_object('zip', v_zip));

  IF v_zip IS NULL OR v_zip = '' OR v_zip !~ '^[0-9]{5}$' THEN
    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'bail_invalid_zip', jsonb_build_object('zip', v_zip));
    RETURN NEW;
  END IF;

  IF NEW.branch_id IS NULL THEN
    SELECT sa.branch_id
      INTO v_resolved_branch
      FROM service_areas sa
      WHERE sa.company_id = NEW.company_id
        AND sa.branch_id IS NOT NULL
        AND sa.is_active = TRUE
        AND sa.zip_codes @> ARRAY[v_zip]
      ORDER BY sa.priority DESC NULLS LAST, sa.created_at ASC
      LIMIT 1;

    IF v_resolved_branch IS NOT NULL THEN
      NEW.branch_id := v_resolved_branch;
      INSERT INTO lead_assignment_debug (lead_id, step, detail)
      VALUES (NEW.id, 'branch_from_service_areas',
              jsonb_build_object('branch_id', v_resolved_branch));
    END IF;
  END IF;

  IF NEW.property_type IS NULL THEN
    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'bail_no_property_type', NULL);
    RETURN NEW;
  END IF;

  -- Distinct property-type-matched inspectors who own this zip. Two-row cap
  -- is enough to distinguish "exactly one" from "two or more".
  WITH candidates AS (
    SELECT DISTINCT zg.assigned_user_id AS user_id
      FROM zip_code_groups zg
      JOIN user_departments ud
        ON ud.user_id = zg.assigned_user_id
       AND ud.company_id = zg.company_id
       AND ud.department = 'inspector'
       AND ud.department_type IN (NEW.property_type, 'both')
     WHERE zg.company_id = NEW.company_id
       AND zg.zip_codes @> ARRAY[v_zip]
       AND zg.assigned_user_id IS NOT NULL
     LIMIT 2
  )
  SELECT COUNT(*),
         CASE WHEN COUNT(*) = 1 THEN MIN(user_id) END
    INTO v_match_count, v_assigned_user
    FROM candidates;

  INSERT INTO lead_assignment_debug (lead_id, step, detail)
  VALUES (NEW.id, 'lookup_property_match', jsonb_build_object(
    'zip', v_zip,
    'property_type', NEW.property_type,
    'company_id', NEW.company_id,
    'distinct_user_count', v_match_count,
    'matched_user', v_assigned_user
  ));

  IF v_match_count = 0 THEN
    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'final_unassigned_no_match', NULL);
    RETURN NEW;
  END IF;

  IF v_match_count > 1 THEN
    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'final_unassigned_multi_match',
            jsonb_build_object('distinct_user_count', v_match_count));
    RETURN NEW;
  END IF;

  IF v_assigned_user IS NOT NULL AND NEW.branch_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_uba_count
      FROM user_branch_assignments
      WHERE user_id = v_assigned_user
        AND company_id = NEW.company_id;

    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'branch_gate_count', jsonb_build_object(
      'user_id', v_assigned_user,
      'uba_count', v_user_uba_count
    ));

    IF v_user_uba_count > 0 THEN
      SELECT COUNT(*) INTO v_user_in_branch
        FROM user_branch_assignments
        WHERE user_id = v_assigned_user
          AND company_id = NEW.company_id
          AND branch_id = NEW.branch_id;

      INSERT INTO lead_assignment_debug (lead_id, step, detail)
      VALUES (NEW.id, 'branch_gate_match', jsonb_build_object(
        'user_id', v_assigned_user,
        'branch_id', NEW.branch_id,
        'in_branch_count', v_user_in_branch
      ));

      IF v_user_in_branch = 0 THEN
        v_assigned_user := NULL;
        INSERT INTO lead_assignment_debug (lead_id, step, detail)
        VALUES (NEW.id, 'branch_gate_rejected', NULL);
      END IF;
    END IF;
  END IF;

  IF v_assigned_user IS NOT NULL THEN
    NEW.assigned_to := v_assigned_user;
    NEW.lead_status := CASE WHEN NEW.lead_status = 'new' OR NEW.lead_status IS NULL
                            THEN 'in_process'
                            ELSE NEW.lead_status END;
    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'assigned', jsonb_build_object(
      'assigned_to', NEW.assigned_to,
      'lead_status', NEW.lead_status
    ));
  ELSE
    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'final_unassigned', NULL);
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION auto_assign_quote_lead() SECURITY DEFINER;
ALTER FUNCTION auto_assign_quote_lead() SET search_path = public, pg_temp;
