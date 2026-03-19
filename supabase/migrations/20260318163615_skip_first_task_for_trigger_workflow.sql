-- Skip task creation for trigger_workflow first steps.
-- The cadence assignment handler (POST/PUT /api/leads/[id]/cadence and
-- start-default-cadence.ts) fires the workflow directly; workflow-execute.ts
-- advances the cadence on completion.

CREATE OR REPLACE FUNCTION trigger_create_first_cadence_task()
RETURNS TRIGGER AS $$
DECLARE
    v_next_step RECORD;
    v_lead_record RECORD;
BEGIN
    -- Get the first cadence step
    SELECT * INTO v_next_step
    FROM get_next_incomplete_cadence_step(NEW.lead_id);

    -- Get lead details
    SELECT
        l.assigned_to,
        l.company_id,
        COALESCE(c.first_name || ' ' || c.last_name, 'Unknown Customer') as customer_name
    INTO v_lead_record
    FROM leads l
    LEFT JOIN customers c ON c.id = l.customer_id
    WHERE l.id = NEW.lead_id;

    -- Create task for first step if it exists, lead has an assignee,
    -- and the step is not a trigger_workflow step (those are fired automatically).
    IF v_next_step.step_id IS NOT NULL
       AND v_lead_record.assigned_to IS NOT NULL
       AND v_next_step.action_type != 'trigger_workflow' THEN
        PERFORM create_task_for_cadence_step(
            NEW.lead_id,
            v_next_step.step_id,
            v_lead_record.assigned_to,
            v_lead_record.company_id,
            v_lead_record.customer_name,
            NEW.started_at
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION trigger_create_first_cadence_task IS
  'Automatically creates a task for the first cadence step when a cadence is assigned to a lead. trigger_workflow steps are skipped — the API route fires those workflows automatically.';
