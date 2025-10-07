-- Update cadence task creation times to match UI expectations
-- Change morning from 9AM to 12PM and afternoon from 2PM to 5PM

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
    v_task_title VARCHAR(255);
    v_company_timezone TEXT;
    v_now_in_company_tz TIMESTAMP;
    v_calculated_in_company_tz TIMESTAMP;
    v_existing_task_id UUID;
    v_day1_morning_date DATE;
    v_day1_morning_time TIMESTAMP;
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

    -- Set due time based on time_of_day (UPDATED: 12PM for morning, 5PM for afternoon)
    IF v_step_record.time_of_day = 'morning' THEN
        v_due_time := '12:00:00'::TIME;
    ELSE
        v_due_time := '17:00:00'::TIME;
    END IF;

    -- Check if Day 1 Morning would be in the past
    -- If so, bump the entire cadence by 1 day to preserve the morning/afternoon pattern
    v_day1_morning_date := (p_started_at AT TIME ZONE v_company_timezone)::DATE;
    v_day1_morning_time := (v_day1_morning_date + '12:00:00'::TIME)::TIMESTAMP;
    v_now_in_company_tz := (NOW() AT TIME ZONE v_company_timezone)::TIMESTAMP;

    -- If Day 1 Morning is in the past, shift the entire cadence forward by 1 day
    IF v_day1_morning_time < v_now_in_company_tz THEN
        v_due_date := v_due_date + INTERVAL '1 day';
    END IF;

    -- Create task title
    v_task_title := 'Day ' || v_step_record.day_number || ': ' ||
                    CASE v_step_record.time_of_day
                        WHEN 'morning' THEN 'Morning'
                        ELSE 'Afternoon'
                    END || ' ' ||
                    CASE v_step_record.action_type
                        WHEN 'outbound_call' THEN 'Call'
                        WHEN 'text_message' THEN 'Text Message'
                        WHEN 'ai_call' THEN 'AI Call'
                        WHEN 'email' THEN 'Email'
                        ELSE v_step_record.action_type
                    END || ' - ' || p_customer_name;

    -- Insert the task with LEADS (plural)
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

COMMENT ON FUNCTION create_task_for_cadence_step IS 'Creates a task for a specific cadence step with times at 12PM (morning) and 5PM (afternoon). If Day 1 Morning is in the past, the entire cadence is shifted forward by 1 day to preserve the morning/afternoon pattern.';
