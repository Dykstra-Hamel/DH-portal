-- Fix lead_cadence_progress insert to use correct column names

CREATE OR REPLACE FUNCTION trigger_auto_progress_cadence()
RETURNS TRIGGER AS $$
DECLARE
    v_current_step RECORD;
    v_next_step RECORD;
    v_lead_record RECORD;
    v_assignment_record RECORD;
    v_customer_name VARCHAR(255);
BEGIN
    -- If skip_task_completion is true, don't auto-progress
    IF NEW.skip_task_completion = TRUE THEN
        RETURN NEW;
    END IF;

    -- Get lead cadence assignment
    SELECT * INTO v_assignment_record
    FROM lead_cadence_assignments
    WHERE lead_id = NEW.lead_id;

    -- Only proceed if lead has an active cadence assignment
    IF v_assignment_record.id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Find the current incomplete step that matches the activity type
    SELECT
        scs.id as step_id,
        scs.cadence_id,
        scs.day_number,
        scs.time_of_day,
        scs.action_type,
        scs.priority,
        scs.display_order,
        scs.description
    INTO v_current_step
    FROM sales_cadence_steps scs
    LEFT JOIN tasks t ON t.cadence_step_id = scs.id
        AND t.related_entity_id = NEW.lead_id
        AND t.status IN ('new', 'in_progress')
    WHERE scs.cadence_id = v_assignment_record.cadence_id
        AND scs.action_type = NEW.action_type
        AND t.id IS NOT NULL
    ORDER BY scs.display_order ASC
    LIMIT 1;

    -- If we found a matching step, mark its task as completed
    IF v_current_step.step_id IS NOT NULL THEN
        UPDATE tasks
        SET status = 'completed',
            completed_at = NOW()
        WHERE cadence_step_id = v_current_step.step_id
            AND related_entity_id = NEW.lead_id
            AND status IN ('new', 'in_progress');

        -- Insert into lead_cadence_progress to track completion
        -- FIXED: Use cadence_step_id (not step_id), don't insert cadence_id
        INSERT INTO lead_cadence_progress (
            lead_id,
            cadence_step_id,
            completed_at
        ) VALUES (
            NEW.lead_id,
            v_current_step.step_id,
            NOW()
        )
        ON CONFLICT (lead_id, cadence_step_id) DO UPDATE
        SET completed_at = NOW();

        -- Get the next incomplete step
        SELECT * INTO v_next_step
        FROM get_next_incomplete_cadence_step(NEW.lead_id);

        -- If there's a next step, create a task for it
        IF v_next_step.step_id IS NOT NULL THEN
            -- Get lead details for task creation
            SELECT
                l.assigned_to,
                l.company_id,
                COALESCE(c.first_name || ' ' || c.last_name, 'Unknown Customer') as customer_name
            INTO v_lead_record
            FROM leads l
            LEFT JOIN customers c ON c.id = l.customer_id
            WHERE l.id = NEW.lead_id;

            -- Create task for next step if lead has an assignee
            IF v_lead_record.assigned_to IS NOT NULL THEN
                PERFORM create_task_for_cadence_step(
                    NEW.lead_id,
                    v_next_step.step_id,
                    v_lead_record.assigned_to,
                    v_lead_record.company_id,
                    v_lead_record.customer_name,
                    v_assignment_record.started_at
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION trigger_auto_progress_cadence IS 'Automatically progresses cadence by completing current task and creating next task when activity is logged, unless skip_task_completion flag is true';
