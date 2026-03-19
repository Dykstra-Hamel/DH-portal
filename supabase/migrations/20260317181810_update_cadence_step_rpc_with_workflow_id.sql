-- Update get_next_incomplete_cadence_step to also return workflow_id
-- DROP first because CREATE OR REPLACE cannot change a function's return type
DROP FUNCTION IF EXISTS get_next_incomplete_cadence_step(UUID);

CREATE OR REPLACE FUNCTION get_next_incomplete_cadence_step(p_lead_id UUID)
RETURNS TABLE (
    step_id UUID,
    cadence_id UUID,
    day_number INTEGER,
    time_of_day VARCHAR,
    action_type VARCHAR,
    priority VARCHAR,
    display_order INTEGER,
    description TEXT,
    workflow_id UUID
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
        scs.description,
        scs.workflow_id
    FROM lead_cadence_assignments lca
    JOIN sales_cadence_steps scs ON scs.cadence_id = lca.cadence_id
    LEFT JOIN lead_cadence_progress lcp ON lcp.lead_id = lca.lead_id
        AND lcp.cadence_step_id = scs.id
    WHERE lca.lead_id = p_lead_id
        AND lca.completed_at IS NULL  -- Active cadence assignment
        AND lcp.id IS NULL            -- Step not yet completed
    ORDER BY scs.display_order ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

COMMENT ON FUNCTION get_next_incomplete_cadence_step IS 'Returns the next incomplete cadence step for a given lead, including workflow_id for trigger_workflow steps';
