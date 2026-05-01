-- Branch-aware extension to auto_assign_quote_lead.
--
-- 1) Resolves NEW.branch_id from service_areas by ZIP when not already set.
-- 2) Skips user assignment when the candidate zip_code_group user is restricted
--    to other branches (user has user_branch_assignments rows for this company,
--    none of which match NEW.branch_id).
--
-- Companies that haven't opted into branches see no behavior change:
--   - service_areas without branch_id never resolve a branch -> NEW.branch_id
--     stays NULL.
--   - When NEW.branch_id is NULL the membership gate is skipped entirely.
--   - Users with no user_branch_assignments rows are unrestricted -> kept.

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

  -- Resolve branch_id from service_areas by ZIP when not already supplied
  -- by the API. Companies without service_areas.branch_id keep NEW.branch_id NULL.
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
    END IF;
  END IF;

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

  -- Branch membership gate. Skip when the lead has no resolved branch_id (so
  -- companies without branches behave identically to today). When the user
  -- has no user_branch_assignments rows for this company, they are unrestricted
  -- and remain a valid candidate.
  IF v_assigned_user IS NOT NULL AND NEW.branch_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_uba_count
      FROM user_branch_assignments
      WHERE user_id = v_assigned_user
        AND company_id = NEW.company_id;

    IF v_user_uba_count > 0 THEN
      SELECT COUNT(*) INTO v_user_in_branch
        FROM user_branch_assignments
        WHERE user_id = v_assigned_user
          AND company_id = NEW.company_id
          AND branch_id = NEW.branch_id;

      IF v_user_in_branch = 0 THEN
        v_assigned_user := NULL;
      END IF;
    END IF;
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
