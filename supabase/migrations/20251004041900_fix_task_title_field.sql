-- Quick fix to ensure create_task_for_cadence_step uses title instead of description
-- This addresses the "null value in column title" error

CREATE OR REPLACE FUNCTION create_task_for_cadence_step(
    p_lead_id UUID,
    p_cadence_step_id UUID,
    p_assigned_to UUID,
    p_company_id UUID,
    p_customer_name VARCHAR,
    p_started_at TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
    v_task_id UUID;
    v_step_record RECORD;
    v_due_date DATE;
    v_due_time TIME;
    v_calculated_datetime TIMESTAMP WITH TIME ZONE;
    v_task_title VARCHAR(255);
    v_action_display VARCHAR(50);
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

    -- Get the step record
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

    -- Build action display name
    CASE v_step_record.action_type
        WHEN 'outbound_call' THEN
            v_action_display := 'Call';
        WHEN 'text_message' THEN
            v_action_display := 'Text Message';
        WHEN 'ai_call' THEN
            v_action_display := 'AI Call';
        WHEN 'email' THEN
            v_action_display := 'Email';
        ELSE
            v_action_display := v_step_record.action_type;
    END CASE;

    -- Create task title
    v_task_title := 'Day ' || v_step_record.day_number || ': ' ||
                    CASE v_step_record.time_of_day
                        WHEN 'morning' THEN 'Morning'
                        ELSE 'Afternoon'
                    END || ' ' || v_action_display || ' - ' || p_customer_name;

    -- Insert the task
    INSERT INTO tasks (
        company_id,
        title,
        status,
        priority,
        assigned_to,
        due_date,
        due_time,
        related_entity_type,
        related_entity_id,
        cadence_step_id
    ) VALUES (
        p_company_id,
        v_task_title,
        'new',
        v_step_record.priority,
        p_assigned_to,
        v_due_date,
        v_due_time,
        'leads',
        p_lead_id,
        p_cadence_step_id
    )
    RETURNING id INTO v_task_id;

    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION create_task_for_cadence_step IS 'Creates a task for a specific cadence step with proper title field';
