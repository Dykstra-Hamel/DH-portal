-- Bidirectional sync between tasks and cadence steps
-- When a task is completed, mark the cadence step complete
-- When a cadence step is completed, mark the task complete

-- =====================================================
-- Function: Complete cadence step when task is completed
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_complete_cadence_step_on_task()
RETURNS TRIGGER AS $$
DECLARE
    v_next_step RECORD;
    v_lead_record RECORD;
    v_assignment_record RECORD;
    v_progress_exists BOOLEAN;
    v_task_exists BOOLEAN;
BEGIN
    -- Only proceed if:
    -- 1. Task status changed to 'completed'
    -- 2. Task has a cadence_step_id
    -- 3. Task is related to a lead
    IF NEW.status = 'completed'
       AND NEW.cadence_step_id IS NOT NULL
       AND NEW.related_entity_type = 'leads'
       AND NEW.related_entity_id IS NOT NULL
       AND (OLD.status IS NULL OR OLD.status != 'completed') THEN

        -- Check if progress already exists for this step
        SELECT EXISTS(
            SELECT 1 FROM lead_cadence_progress
            WHERE lead_id = NEW.related_entity_id
            AND cadence_step_id = NEW.cadence_step_id
        ) INTO v_progress_exists;

        -- Only create progress if it doesn't exist yet
        IF NOT v_progress_exists THEN
            -- Mark the cadence step as complete
            INSERT INTO lead_cadence_progress (
                lead_id,
                cadence_step_id,
                completed_at,
                completed_by_activity_id
            ) VALUES (
                NEW.related_entity_id,
                NEW.cadence_step_id,
                NEW.completed_at,
                NULL  -- Completed by task, not activity
            );

            -- Get the lead's cadence assignment
            SELECT * INTO v_assignment_record
            FROM lead_cadence_assignments
            WHERE lead_id = NEW.related_entity_id;

            -- Only proceed if cadence is not paused and assignment exists
            IF v_assignment_record.id IS NOT NULL AND v_assignment_record.paused_at IS NULL THEN
                -- Get the next incomplete step
                SELECT * INTO v_next_step
                FROM get_next_incomplete_cadence_step(NEW.related_entity_id);

                -- Get lead details
                SELECT
                    l.assigned_to,
                    l.company_id,
                    COALESCE(c.first_name || ' ' || c.last_name, 'Unknown Customer') as customer_name
                INTO v_lead_record
                FROM leads l
                LEFT JOIN customers c ON c.id = l.customer_id
                WHERE l.id = NEW.related_entity_id;

                -- Check if a task already exists for the next step
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

                -- Create task for next step only if:
                -- 1. Next step exists
                -- 2. Lead has an assignee
                -- 3. Task doesn't already exist
                IF v_next_step.step_id IS NOT NULL
                   AND v_lead_record.assigned_to IS NOT NULL
                   AND NOT v_task_exists THEN
                    PERFORM create_task_for_cadence_step(
                        NEW.related_entity_id,
                        v_next_step.step_id,
                        v_lead_record.assigned_to,
                        v_lead_record.company_id,
                        v_lead_record.customer_name,
                        v_assignment_record.started_at
                    );
                ELSIF v_next_step.step_id IS NULL THEN
                    -- All steps completed, mark cadence as complete
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

COMMENT ON FUNCTION trigger_complete_cadence_step_on_task IS 'Marks cadence step complete when associated task is completed. Respects pause state and prevents duplicate task creation.';

-- Create trigger on tasks table
CREATE TRIGGER trigger_complete_cadence_step_on_task_update
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION trigger_complete_cadence_step_on_task();

-- =====================================================
-- Function: Complete task when cadence step is completed
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_complete_task_on_cadence_step()
RETURNS TRIGGER AS $$
BEGIN
    -- When a cadence step is marked complete, mark any associated tasks as complete
    UPDATE tasks
    SET
        status = 'completed',
        completed_at = NEW.completed_at,
        updated_at = NOW()
    WHERE cadence_step_id = NEW.cadence_step_id
        AND related_entity_id = NEW.lead_id
        AND related_entity_type = 'leads'
        AND status != 'completed';  -- Only update if not already completed

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION trigger_complete_task_on_cadence_step IS 'Marks associated task complete when cadence step is completed';

-- Create trigger on lead_cadence_progress table
CREATE TRIGGER trigger_complete_task_on_cadence_step_insert
    AFTER INSERT ON lead_cadence_progress
    FOR EACH ROW
    EXECUTE FUNCTION trigger_complete_task_on_cadence_step();
