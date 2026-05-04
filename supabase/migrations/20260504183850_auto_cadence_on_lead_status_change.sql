-- Auto cadence assignment via DB trigger on leads table.
-- Any UPDATE to lead_status (from any route) will automatically apply
-- the correct default cadence without per-route wiring.
--
-- Status → cadence logic:
--   'quoted'                          → DELETE existing + INSERT default_quote_followup_cadence_id
--   'in_process'                      → INSERT default_initial_contact_cadence_id (if none active & assigned_to set)
--   'scheduling','won','lost','unqualified' → DELETE existing only
--   assigned_to: NULL→value on in_process lead → INSERT default_initial_contact_cadence_id (if none active)
--
-- Note: The existing DB trigger `trigger_create_first_task_on_cadence_assignment`
-- handles first-task creation automatically after INSERT into lead_cadence_assignments.
-- trigger_workflow first steps are fired from app code via fireTriggerWorkflowIfNeeded().

CREATE OR REPLACE FUNCTION handle_lead_cadence_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cadence_id uuid;
BEGIN
  -- ── Status change handling ────────────────────────────────────────────────
  IF OLD.lead_status IS DISTINCT FROM NEW.lead_status THEN

    IF NEW.lead_status = 'quoted' THEN
      -- Always clear existing assignment, then start quote follow-up cadence
      DELETE FROM public.lead_cadence_assignments WHERE lead_id = NEW.id;

      IF NEW.assigned_to IS NOT NULL THEN
        SELECT sc.id INTO v_cadence_id
        FROM public.company_settings cs
        JOIN public.sales_cadences sc
          ON sc.id::text = cs.setting_value
         AND sc.is_active = true
        WHERE cs.company_id = NEW.company_id
          AND cs.setting_key = 'default_quote_followup_cadence_id'
        LIMIT 1;

        IF v_cadence_id IS NOT NULL THEN
          INSERT INTO public.lead_cadence_assignments (lead_id, cadence_id, started_at)
          VALUES (NEW.id, v_cadence_id, NOW());
        END IF;
      END IF;

    ELSIF NEW.lead_status = 'in_process' THEN
      -- Only start initial contact cadence if none active and lead has assignee
      IF NEW.assigned_to IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM public.lead_cadence_assignments
           WHERE lead_id = NEW.id AND completed_at IS NULL
         ) THEN

        SELECT sc.id INTO v_cadence_id
        FROM public.company_settings cs
        JOIN public.sales_cadences sc
          ON sc.id::text = cs.setting_value
         AND sc.is_active = true
        WHERE cs.company_id = NEW.company_id
          AND cs.setting_key = 'default_initial_contact_cadence_id'
        LIMIT 1;

        IF v_cadence_id IS NOT NULL THEN
          INSERT INTO public.lead_cadence_assignments (lead_id, cadence_id, started_at)
          VALUES (NEW.id, v_cadence_id, NOW())
          ON CONFLICT (lead_id) DO NOTHING;
        END IF;
      END IF;

    ELSIF NEW.lead_status IN ('scheduling', 'won', 'lost', 'unqualified') THEN
      -- Remove cadence assignment; app-level cleanup (tasks, executions) handled by stopActiveCadence / closeLeadForTerminalStatus
      DELETE FROM public.lead_cadence_assignments WHERE lead_id = NEW.id;

    END IF;
  END IF;

  -- ── assigned_to: NULL → non-NULL on an in_process lead (status unchanged) ─
  IF OLD.lead_status = NEW.lead_status
     AND NEW.lead_status = 'in_process'
     AND OLD.assigned_to IS NULL
     AND NEW.assigned_to IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.lead_cadence_assignments
       WHERE lead_id = NEW.id AND completed_at IS NULL
     ) THEN

    SELECT sc.id INTO v_cadence_id
    FROM public.company_settings cs
    JOIN public.sales_cadences sc
      ON sc.id::text = cs.setting_value
     AND sc.is_active = true
    WHERE cs.company_id = NEW.company_id
      AND cs.setting_key = 'default_initial_contact_cadence_id'
    LIMIT 1;

    IF v_cadence_id IS NOT NULL THEN
      INSERT INTO public.lead_cadence_assignments (lead_id, cadence_id, started_at)
      VALUES (NEW.id, v_cadence_id, NOW())
      ON CONFLICT (lead_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if present (idempotent migration)
DROP TRIGGER IF EXISTS trigger_auto_cadence_on_lead_status_change ON public.leads;

CREATE TRIGGER trigger_auto_cadence_on_lead_status_change
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION handle_lead_cadence_on_status_change();
