-- Update get_eligible_addons_for_plan function to include initial_price
-- This allows the UI to display both initial and recurring prices for add-ons

-- Drop the existing function first since we're changing the return type
DROP FUNCTION IF EXISTS get_eligible_addons_for_plan(UUID, UUID);

-- Recreate with initial_price included
CREATE FUNCTION get_eligible_addons_for_plan(
  p_service_plan_id UUID,
  p_company_id UUID
)
RETURNS TABLE (
  addon_id UUID,
  addon_name TEXT,
  addon_description TEXT,
  initial_price DECIMAL,
  recurring_price DECIMAL,
  eligibility_mode TEXT,
  is_eligible BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aos.id,
    aos.addon_name,
    aos.addon_description,
    aos.initial_price,
    aos.recurring_price,
    aos.eligibility_mode,
    CASE
      -- Add-on with 'all' mode is always eligible
      WHEN aos.eligibility_mode = 'all' THEN true
      -- Add-on with 'specific' mode is eligible if linked in junction table
      WHEN aos.eligibility_mode = 'specific' THEN EXISTS (
        SELECT 1 FROM addon_service_plan_eligibility aspe
        WHERE aspe.addon_id = aos.id
        AND aspe.service_plan_id = p_service_plan_id
      )
      ELSE false
    END AS is_eligible
  FROM add_on_services aos
  WHERE aos.company_id = p_company_id
  AND aos.is_active = true
  ORDER BY aos.display_order, aos.addon_name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_eligible_addons_for_plan IS
'Returns all add-ons for a company with eligibility flag and pricing for a specific service plan';
