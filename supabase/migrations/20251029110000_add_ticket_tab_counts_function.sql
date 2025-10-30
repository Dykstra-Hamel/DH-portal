-- Migration: Add optimized function for ticket tab counts
-- Purpose: Replace 4 separate count queries with a single SQL query using FILTER

CREATE OR REPLACE FUNCTION get_ticket_tab_counts(
  p_company_id UUID,
  p_include_archived BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'all', COUNT(*) FILTER (
      WHERE status != 'live'
      AND (archived IS NULL OR archived = false)
    ),
    'incoming', COUNT(*) FILTER (
      WHERE type = 'phone_call'
      AND call_direction = 'inbound'
      AND (archived IS NULL OR archived = false)
    ),
    'outbound', COUNT(*) FILTER (
      WHERE type = 'phone_call'
      AND call_direction = 'outbound'
      AND (archived IS NULL OR archived = false)
    ),
    'forms', COUNT(*) FILTER (
      WHERE type = 'web_form'
      AND (archived IS NULL OR archived = false)
    )
  ) INTO result
  FROM tickets
  WHERE company_id = p_company_id
  AND (
    CASE
      WHEN p_include_archived THEN archived = true
      ELSE (archived IS NULL OR archived = false)
    END
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION get_ticket_tab_counts(UUID, BOOLEAN) IS
  'Returns counts for all ticket tabs (all, incoming, outbound, forms) in a single query using FILTER clauses. Replaces 4 separate count queries for better performance.';
