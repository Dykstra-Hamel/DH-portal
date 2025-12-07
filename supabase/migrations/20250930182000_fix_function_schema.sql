-- Fix schema search path for cadence functions
-- The issue is that functions with empty search_path cannot find other functions

-- Drop triggers first before dropping functions
DROP TRIGGER IF EXISTS trigger_create_first_task_on_cadence_assignment ON lead_cadence_assignments;
DROP TRIGGER IF EXISTS trigger_auto_progress_on_activity ON lead_activity_log;

-- Now drop the functions
DROP FUNCTION IF EXISTS get_next_incomplete_cadence_step(UUID);
DROP FUNCTION IF EXISTS create_task_for_cadence_step(UUID, UUID, UUID, UUID, VARCHAR, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS trigger_create_first_cadence_task();
DROP FUNCTION IF EXISTS trigger_auto_progress_cadence();

-- Recreate get_next_incomplete_cadence_step with public schema
CREATE OR REPLACE FUNCTION get_next_incomplete_cadence_step(p_lead_id UUID)
RETURNS TABLE (
    step_id UUID,
    cadence_id UUID,
    day_number INTEGER,
    time_of_day VARCHAR,
    action_type VARCHAR,
    priority VARCHAR,
    display_order INTEGER,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        scs.id,
        scs.cadence_id,
        scs.day_number,
        scs.time_of_day,
        scs.action_type,
        scs.priority,
        scs.display_order,
        scs.description
    FROM lead_cadence_assignments lca
    JOIN sales_cadence_steps scs ON scs.cadence_id = lca.cadence_id
    LEFT JOIN lead_cadence_progress lcp ON lcp.lead_id = lca.lead_id
        AND lcp.cadence_step_id = scs.id
    WHERE lca.lead_id = p_lead_id
        AND lcp.id IS NULL  -- Step not yet completed
    ORDER BY scs.display_order ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION get_next_incomplete_cadence_step IS 'Returns the next incomplete cadence step for a given lead';

-- Recreate create_task_for_cadence_step with public schema
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

    -- Calculate due date (started_at + day_number - 1 days)
    v_due_date := (p_started_at + ((v_step_record.day_number - 1) || ' days')::INTERVAL)::DATE;

    -- Calculate due time based on time_of_day
    v_due_time := CASE
        WHEN v_step_record.time_of_day = 'morning' THEN '12:00:00'::TIME
        WHEN v_step_record.time_of_day = 'afternoon' THEN '17:00:00'::TIME
        ELSE '12:00:00'::TIME
    END;

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
        'pending',
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

COMMENT ON FUNCTION create_task_for_cadence_step IS 'Creates a task for a specific cadence step with calculated due date and time';

-- Recreate trigger_create_first_cadence_task with public schema
CREATE OR REPLACE FUNCTION trigger_create_first_cadence_task()
RETURNS TRIGGER AS $$
DECLARE
    v_next_step RECORD;
    v_lead_record RECORD;
    v_customer_name VARCHAR(255);
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

    -- Create task for first step if it exists and lead has an assignee
    IF v_next_step.step_id IS NOT NULL AND v_lead_record.assigned_to IS NOT NULL THEN
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

COMMENT ON FUNCTION trigger_create_first_cadence_task IS 'Automatically creates a task for the first cadence step when a cadence is assigned to a lead';

-- Recreate trigger_auto_progress_cadence with public schema
CREATE OR REPLACE FUNCTION trigger_auto_progress_cadence()
RETURNS TRIGGER AS $$
DECLARE
    v_current_step RECORD;
    v_next_step RECORD;
    v_lead_record RECORD;
    v_assignment_record RECORD;
    v_customer_name VARCHAR(255);
BEGIN
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
        scs.action_type
    INTO v_current_step
    FROM sales_cadence_steps scs
    LEFT JOIN lead_cadence_progress lcp ON lcp.cadence_step_id = scs.id
        AND lcp.lead_id = NEW.lead_id
    WHERE scs.cadence_id = v_assignment_record.cadence_id
        AND lcp.id IS NULL  -- Not yet completed
        AND scs.action_type = NEW.action_type  -- Matches activity type
    ORDER BY scs.display_order ASC
    LIMIT 1;

    -- Mark the current step as complete if found
    IF v_current_step.step_id IS NOT NULL THEN
        INSERT INTO lead_cadence_progress (
            lead_id,
            cadence_step_id,
            completed_at,
            completed_by_activity_id
        ) VALUES (
            NEW.lead_id,
            v_current_step.step_id,
            NEW.created_at,
            NEW.id
        );

        -- Get the next incomplete step
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

        -- Create task for next step if it exists and lead has an assignee
        IF v_next_step.step_id IS NOT NULL AND v_lead_record.assigned_to IS NOT NULL THEN
            PERFORM create_task_for_cadence_step(
                NEW.lead_id,
                v_next_step.step_id,
                v_lead_record.assigned_to,
                v_lead_record.company_id,
                v_lead_record.customer_name,
                v_assignment_record.started_at
            );
        ELSIF v_next_step.step_id IS NULL THEN
            -- All steps completed, mark cadence as complete
            UPDATE lead_cadence_assignments
            SET completed_at = NEW.created_at
            WHERE lead_id = NEW.lead_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION trigger_auto_progress_cadence IS 'Automatically marks cadence steps complete and creates next task when matching activity is logged';

-- Recreate the triggers
CREATE TRIGGER trigger_create_first_task_on_cadence_assignment
    AFTER INSERT ON lead_cadence_assignments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_first_cadence_task();

CREATE TRIGGER trigger_auto_progress_on_activity
    AFTER INSERT ON lead_activity_log
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_progress_cadence();
