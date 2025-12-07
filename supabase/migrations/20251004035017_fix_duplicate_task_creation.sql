-- Fix duplicate task creation by ensuring proper progress tracking and duplicate prevention

-- Update trigger to insert into lead_cadence_progress when marking task complete
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

-- Update create_task_for_cadence_step to prevent duplicate task creation
CREATE OR REPLACE FUNCTION create_task_for_cadence_step(
    p_lead_id UUID,
    p_cadence_step_id UUID,
    p_assigned_to UUID,
    p_company_id UUID,
    p_customer_name VARCHAR,
    p_started_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
    v_step_record RECORD;
    v_task_id UUID;
    v_due_date DATE;
    v_due_time TIME;
    v_task_description TEXT;
    v_company_timezone TEXT;
    v_now_in_company_tz TIMESTAMP;
    v_calculated_in_company_tz TIMESTAMP;
    v_existing_task_id UUID;
BEGIN
    -- Check if a task already exists for this lead and step
    SELECT id INTO v_existing_task_id
    FROM tasks
    WHERE cadence_step_id = p_cadence_step_id
        AND related_entity_id = p_lead_id
        AND status IN ('new', 'in_progress')
    LIMIT 1;

    -- If task already exists, return its ID without creating a new one
    IF v_existing_task_id IS NOT NULL THEN
        RETURN v_existing_task_id;
    END IF;

    -- Get company timezone, default to America/New_York if not set
    SELECT setting_value INTO v_company_timezone
    FROM company_settings
    WHERE company_id = p_company_id AND setting_key = 'company_timezone';

    IF v_company_timezone IS NULL THEN
        v_company_timezone := 'America/New_York';
    END IF;

    -- Get step details
    SELECT * INTO v_step_record
    FROM sales_cadence_steps
    WHERE id = p_cadence_step_id;

    -- Calculate due date based on day number (day 1 = started_at date)
    v_due_date := ((p_started_at AT TIME ZONE v_company_timezone)::DATE +
                   ((v_step_record.day_number - 1) || ' days')::INTERVAL)::DATE;

    -- Set due time based on time_of_day
    IF v_step_record.time_of_day = 'morning' THEN
        v_due_time := '09:00:00'::TIME;
    ELSE
        v_due_time := '14:00:00'::TIME;
    END IF;

    -- Convert both NOW() and calculated datetime to company timezone for comparison
    v_now_in_company_tz := (NOW() AT TIME ZONE v_company_timezone)::TIMESTAMP;
    v_calculated_in_company_tz := (v_due_date + v_due_time)::TIMESTAMP;

    -- If calculated datetime is in the past, move to next available slot
    IF v_calculated_in_company_tz < v_now_in_company_tz THEN
        -- If it's morning slot and we're past morning, try afternoon
        IF v_step_record.time_of_day = 'morning' THEN
            v_due_time := '14:00:00'::TIME;
            v_calculated_in_company_tz := (v_due_date + v_due_time)::TIMESTAMP;

            -- If afternoon is also past, move to next day morning
            IF v_calculated_in_company_tz < v_now_in_company_tz THEN
                v_due_date := v_due_date + INTERVAL '1 day';
                v_due_time := '09:00:00'::TIME;
            END IF;
        ELSE
            -- For afternoon slots, just move to next day afternoon
            v_due_date := v_due_date + INTERVAL '1 day';
        END IF;
    END IF;

    -- Create task title
    v_task_description := 'Day ' || v_step_record.day_number || ': ' ||
                         CASE v_step_record.time_of_day
                           WHEN 'morning' THEN 'Morning'
                           ELSE 'Afternoon'
                         END || ' ';

    v_task_description := v_task_description ||
        CASE v_step_record.action_type
            WHEN 'outbound_call' THEN 'Call'
            WHEN 'text_message' THEN 'Text Message'
            WHEN 'ai_call' THEN 'AI Call'
            WHEN 'email' THEN 'Email'
            ELSE v_step_record.action_type
        END || ' - ' || p_customer_name;

    -- Insert the task
    INSERT INTO tasks (
        company_id,
        title,
        status,
        priority,
        due_date,
        due_time,
        assigned_to,
        related_entity_type,
        related_entity_id,
        cadence_step_id
    ) VALUES (
        p_company_id,
        v_task_description,
        'new',
        v_step_record.priority,
        v_due_date,
        v_due_time,
        p_assigned_to,
        'leads',
        p_lead_id,
        p_cadence_step_id
    )
    RETURNING id INTO v_task_id;

    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION create_task_for_cadence_step IS 'Creates a task for a specific cadence step, preventing duplicates and scheduling in company timezone';
