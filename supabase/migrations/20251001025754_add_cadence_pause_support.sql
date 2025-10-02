-- =====================================================
-- Add Pause Support to Sales Cadence System
-- =====================================================
-- This migration adds the ability to pause/unpause cadences
-- and updates triggers to respect pause state

-- =====================================================
-- Add paused_at column to lead_cadence_assignments
-- =====================================================
ALTER TABLE lead_cadence_assignments
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE;

-- Create index for pause queries
CREATE INDEX IF NOT EXISTS idx_lead_cadence_assignments_paused_at
ON lead_cadence_assignments(paused_at);

-- Comment
COMMENT ON COLUMN lead_cadence_assignments.paused_at IS 'Timestamp when cadence was paused. NULL means cadence is active.';

-- =====================================================
-- Update trigger to respect pause state
-- =====================================================
-- Drop and recreate the auto-progress trigger to check for pause
DROP TRIGGER IF EXISTS trigger_auto_progress_on_activity ON lead_activity_log;

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

    -- Skip if cadence is paused
    IF v_assignment_record.paused_at IS NOT NULL THEN
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

-- Recreate the trigger
CREATE TRIGGER trigger_auto_progress_on_activity
    AFTER INSERT ON lead_activity_log
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_progress_cadence();

COMMENT ON FUNCTION trigger_auto_progress_cadence IS 'Automatically marks cadence steps complete and creates next task when matching activity is logged. Respects pause state.';
