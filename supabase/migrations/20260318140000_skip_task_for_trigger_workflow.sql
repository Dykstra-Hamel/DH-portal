-- Prevent task creation for trigger_workflow steps.
-- The API route (tasks/[id]/complete) fires the workflow automatically;
-- workflow-execute.ts creates the following step's task on completion.

CREATE OR REPLACE FUNCTION trigger_complete_cadence_step_on_task()
RETURNS TRIGGER AS $$
DECLARE
    v_next_step RECORD;
    v_lead_record RECORD;
    v_assignment_record RECORD;
    v_progress_exists BOOLEAN;
    v_task_exists BOOLEAN;
BEGIN
    IF NEW.status = 'completed'
       AND NEW.cadence_step_id IS NOT NULL
       AND NEW.related_entity_type = 'leads'
       AND NEW.related_entity_id IS NOT NULL
       AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

        SELECT EXISTS(
            SELECT 1 FROM lead_cadence_progress
            WHERE lead_id = NEW.related_entity_id
            AND cadence_step_id = NEW.cadence_step_id
        ) INTO v_progress_exists;

        IF NOT v_progress_exists THEN
            INSERT INTO lead_cadence_progress (lead_id, cadence_step_id, completed_at, completed_by_activity_id)
            VALUES (NEW.related_entity_id, NEW.cadence_step_id, NEW.completed_at, NULL);

            SELECT * INTO v_assignment_record FROM lead_cadence_assignments WHERE lead_id = NEW.related_entity_id;

            IF v_assignment_record.id IS NOT NULL AND v_assignment_record.paused_at IS NULL THEN
                SELECT * INTO v_next_step FROM get_next_incomplete_cadence_step(NEW.related_entity_id);

                SELECT l.assigned_to, l.company_id,
                       COALESCE(c.first_name || ' ' || c.last_name, 'Unknown Customer') as customer_name
                INTO v_lead_record
                FROM leads l LEFT JOIN customers c ON c.id = l.customer_id
                WHERE l.id = NEW.related_entity_id;

                IF v_next_step.step_id IS NOT NULL THEN
                    SELECT EXISTS(
                        SELECT 1 FROM tasks
                        WHERE cadence_step_id = v_next_step.step_id
                        AND related_entity_id = NEW.related_entity_id
                        AND related_entity_type = 'leads'
                        AND status != 'completed'
                    ) INTO v_task_exists;
                ELSE
                    v_task_exists := FALSE;
                END IF;

                IF v_next_step.step_id IS NOT NULL
                   AND v_lead_record.assigned_to IS NOT NULL
                   AND NOT v_task_exists
                   AND v_next_step.action_type != 'trigger_workflow' THEN
                    PERFORM create_task_for_cadence_step(
                        NEW.related_entity_id, v_next_step.step_id,
                        v_lead_record.assigned_to, v_lead_record.company_id,
                        v_lead_record.customer_name, v_assignment_record.started_at
                    );
                ELSIF v_next_step.step_id IS NULL THEN
                    UPDATE lead_cadence_assignments
                    SET completed_at = NEW.completed_at
                    WHERE lead_id = NEW.related_entity_id;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION trigger_complete_cadence_step_on_task IS
  'Marks cadence step complete when associated task is completed. trigger_workflow steps are skipped — the API route fires those workflows automatically.';
