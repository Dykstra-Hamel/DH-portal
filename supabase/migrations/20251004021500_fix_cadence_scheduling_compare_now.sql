-- Fix cadence task scheduling to compare against current time, not started_at
-- A task scheduled for 12PM today should be bumped to tomorrow if it's already past 12PM

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
BEGIN
    -- Get step details
    SELECT
        day_number,
        time_of_day,
        action_type,
        priority,
        description
    INTO v_step_record
    FROM sales_cadence_steps
    WHERE id = p_cadence_step_id;

    -- Calculate initial due date (started_at + day_number - 1 days)
    v_due_date := (p_started_at + ((v_step_record.day_number - 1) || ' days')::INTERVAL)::DATE;

    -- Calculate due time based on time_of_day
    v_due_time := CASE
        WHEN v_step_record.time_of_day = 'morning' THEN '12:00:00'::TIME
        WHEN v_step_record.time_of_day = 'afternoon' THEN '17:00:00'::TIME
        ELSE '12:00:00'::TIME
    END;

    -- Combine date and time to check if it's in the past
    v_calculated_datetime := (v_due_date::TEXT || ' ' || v_due_time::TEXT)::TIMESTAMP WITH TIME ZONE;

    -- IMPORTANT: Compare against NOW(), not p_started_at
    -- If the calculated datetime is in the past, bump to next day
    IF v_calculated_datetime < NOW() THEN
        v_due_date := v_due_date + INTERVAL '1 day';
    END IF;

    -- Format action type for display
    v_action_display := CASE v_step_record.action_type
        WHEN 'live_call' THEN 'Live Call'
        WHEN 'outbound_call' THEN 'Outbound Call'
        WHEN 'text_message' THEN 'Text Message'
        WHEN 'ai_call' THEN 'AI Call'
        WHEN 'email' THEN 'Email'
        ELSE v_step_record.action_type
    END;

    -- Format task title
    v_task_title := 'Day ' || v_step_record.day_number || ': ' ||
                    INITCAP(v_step_record.time_of_day) || ' ' ||
                    v_action_display || ' - ' || p_customer_name;

    -- Create the task
    INSERT INTO tasks (
        company_id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
        due_time,
        related_entity_type,
        related_entity_id,
        cadence_step_id,
        created_at
    ) VALUES (
        p_company_id,
        v_task_title,
        v_step_record.description,
        'new',
        v_step_record.priority,
        p_assigned_to,
        v_due_date,
        v_due_time,
        'leads',
        p_lead_id,
        p_cadence_step_id,
        NOW()
    )
    RETURNING id INTO v_task_id;

    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION create_task_for_cadence_step IS 'Creates a task for a specific cadence step with calculated due date and time. If the calculated time is already past the current time, it schedules for the next day to ensure tasks are always in the future.';
