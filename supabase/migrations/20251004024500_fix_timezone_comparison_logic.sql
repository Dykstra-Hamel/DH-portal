-- Fix timezone comparison - we need to treat the calculated time as being IN the company timezone
-- then compare it to the current time also IN the company timezone

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
    v_calculated_datetime_utc TIMESTAMP WITH TIME ZONE;
    v_task_title VARCHAR(255);
    v_action_display VARCHAR(50);
    v_company_timezone TEXT;
    v_now_in_company_tz TIMESTAMP;
    v_calculated_in_company_tz TIMESTAMP;
BEGIN
    -- Get company timezone setting
    SELECT setting_value INTO v_company_timezone
    FROM company_settings
    WHERE company_id = p_company_id AND setting_key = 'company_timezone';

    -- Default to UTC if no timezone is set
    IF v_company_timezone IS NULL THEN
        v_company_timezone := 'UTC';
    END IF;

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

    -- Calculate initial due date in company timezone
    v_due_date := ((p_started_at AT TIME ZONE v_company_timezone)::DATE +
                   ((v_step_record.day_number - 1) || ' days')::INTERVAL)::DATE;

    -- Calculate due time based on time_of_day
    v_due_time := CASE
        WHEN v_step_record.time_of_day = 'morning' THEN '12:00:00'::TIME
        WHEN v_step_record.time_of_day = 'afternoon' THEN '17:00:00'::TIME
        ELSE '12:00:00'::TIME
    END;

    -- Get current time as timestamp (no tz) in company timezone
    v_now_in_company_tz := (NOW() AT TIME ZONE v_company_timezone)::TIMESTAMP;

    -- Combine date and time to get timestamp (no tz) in company timezone
    v_calculated_in_company_tz := (v_due_date + v_due_time)::TIMESTAMP;

    -- Compare both as timestamps in company timezone
    -- If the calculated time is in the past, bump to next day
    IF v_calculated_in_company_tz < v_now_in_company_tz THEN
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

COMMENT ON FUNCTION create_task_for_cadence_step IS 'Creates a task for a specific cadence step with calculated due date and time based on company timezone. If the calculated time is already past in the company''s local time, it schedules for the next day.';
