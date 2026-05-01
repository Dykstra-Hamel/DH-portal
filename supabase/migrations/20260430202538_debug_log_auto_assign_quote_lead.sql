-- Debug instrumentation for auto_assign_quote_lead.
--
-- Tech new-leads with valid zip + property_type + branch are still coming in
-- unassigned even though admin-side queries show a perfectly valid inspector.
-- SECURITY DEFINER did not fix it. We need to see exactly which branch the
-- trigger is taking on a real insert.
--
-- This migration:
--   1. Creates a lead_assignment_debug table for the trigger to write to.
--   2. Replaces auto_assign_quote_lead with an instrumented copy that logs
--      at every decision point.
--
-- After repro, query:
--   SELECT step, detail, created_at
--     FROM lead_assignment_debug
--     ORDER BY created_at DESC
--     LIMIT 50;
--
-- Once the root cause is identified, drop the table and revert the function
-- to a clean (non-logging) version.

CREATE TABLE IF NOT EXISTS lead_assignment_debug (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id     UUID,
  step        TEXT NOT NULL,
  detail      JSONB
);

CREATE INDEX IF NOT EXISTS lead_assignment_debug_created_at_idx
  ON lead_assignment_debug (created_at DESC);

-- Allow the SECURITY DEFINER function to write here. Keep RLS off so the
-- trigger can always insert regardless of caller privileges.
ALTER TABLE lead_assignment_debug DISABLE ROW LEVEL SECURITY;

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
  v_pref_match_user  UUID;
  v_zip_only_user    UUID;
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

  -- Preferred lookup: zip + property_type
  SELECT zg.assigned_user_id INTO v_pref_match_user
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

  INSERT INTO lead_assignment_debug (lead_id, step, detail)
  VALUES (NEW.id, 'lookup_preferred', jsonb_build_object(
    'zip', v_zip,
    'property_type', NEW.property_type,
    'company_id', NEW.company_id,
    'matched_user', v_pref_match_user
  ));

  v_assigned_user := v_pref_match_user;

  IF v_assigned_user IS NULL THEN
    SELECT assigned_user_id INTO v_zip_only_user
      FROM zip_code_groups
      WHERE company_id = NEW.company_id
        AND zip_codes @> ARRAY[v_zip]
        AND assigned_user_id IS NOT NULL
      LIMIT 1;

    INSERT INTO lead_assignment_debug (lead_id, step, detail)
    VALUES (NEW.id, 'lookup_zip_only', jsonb_build_object(
      'zip', v_zip,
      'company_id', NEW.company_id,
      'matched_user', v_zip_only_user
    ));

    v_assigned_user := v_zip_only_user;
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
