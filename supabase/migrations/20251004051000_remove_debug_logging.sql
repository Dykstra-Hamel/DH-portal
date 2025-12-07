-- Remove debug logging from create_task_for_cadence_step function

DROP FUNCTION IF EXISTS create_task_for_cadence_step CASCADE;

CREATE OR REPLACE FUNCTION create_task_for_cadence_step(
    p_lead_id UUID,
    p_cadence_step_id UUID,
    p_assigned_to UUID,
    p_company_id UUID,
    p_customer_name VARCHAR,
    p_started_at TIMESTAMP WITH TIME ZONE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_task_id UUID;
    v_step_record RECORD;
    v_due_date DATE;
    v_due_time TIME;
    v_task_title TEXT;
    v_company_timezone TEXT;
    v_now_in_company_tz TIMESTAMP;
    v_calculated_in_company_tz TIMESTAMP;
BEGIN
    -- Get company timezone
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

    -- Calculate due date
    v_due_date := ((p_started_at AT TIME ZONE v_company_timezone)::DATE +
                   ((v_step_record.day_number - 1) || ' days')::INTERVAL)::DATE;

    -- Set due time
    IF v_step_record.time_of_day = 'morning' THEN
        v_due_time := '09:00:00'::TIME;
    ELSE
        v_due_time := '14:00:00'::TIME;
    END IF;

    -- Check if in past
    v_now_in_company_tz := (NOW() AT TIME ZONE v_company_timezone)::TIMESTAMP;
    v_calculated_in_company_tz := (v_due_date + v_due_time)::TIMESTAMP;

    IF v_calculated_in_company_tz < v_now_in_company_tz THEN
        IF v_step_record.time_of_day = 'morning' THEN
            v_due_time := '14:00:00'::TIME;
            v_calculated_in_company_tz := (v_due_date + v_due_time)::TIMESTAMP;
            IF v_calculated_in_company_tz < v_now_in_company_tz THEN
                v_due_date := v_due_date + INTERVAL '1 day';
                v_due_time := '09:00:00'::TIME;
            END IF;
        ELSE
            v_due_date := v_due_date + INTERVAL '1 day';
        END IF;
    END IF;

    -- Create title
    v_task_title := 'Day ' || v_step_record.day_number || ': ' ||
                    CASE v_step_record.time_of_day WHEN 'morning' THEN 'Morning' ELSE 'Afternoon' END || ' ' ||
                    CASE v_step_record.action_type
                        WHEN 'outbound_call' THEN 'Call'
                        WHEN 'text_message' THEN 'Text Message'
                        WHEN 'ai_call' THEN 'AI Call'
                        WHEN 'email' THEN 'Email'
                        ELSE v_step_record.action_type
                    END || ' - ' || p_customer_name;

    -- Insert task
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
$$;

COMMENT ON FUNCTION create_task_for_cadence_step IS 'Creates a task for a specific cadence step with proper timezone handling';
