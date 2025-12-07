-- Helper functions for add-on services

-- Function 1: Get eligible add-ons for a specific service plan
-- Returns all add-ons for a company with an is_eligible flag
CREATE OR REPLACE FUNCTION get_eligible_addons_for_plan(
  p_service_plan_id UUID,
  p_company_id UUID
)
RETURNS TABLE (
  addon_id UUID,
  addon_name TEXT,
  addon_description TEXT,
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
'Returns all add-ons for a company with eligibility flag for a specific service plan';

-- Function 2: Validate if an add-on can be added to a quote
-- Checks if the quote contains a service plan that the add-on is eligible for
CREATE OR REPLACE FUNCTION validate_addon_eligibility(
  p_addon_id UUID,
  p_quote_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_eligibility_mode TEXT;
  v_is_eligible BOOLEAN := false;
BEGIN
  -- Get the add-on's eligibility mode
  SELECT eligibility_mode INTO v_eligibility_mode
  FROM add_on_services
  WHERE id = p_addon_id;

  -- If mode is 'all', it's always eligible
  IF v_eligibility_mode = 'all' THEN
    RETURN true;
  END IF;

  -- If mode is 'specific', check if quote has an eligible service plan
  IF v_eligibility_mode = 'specific' THEN
    SELECT EXISTS (
      SELECT 1
      FROM quote_line_items qli
      JOIN addon_service_plan_eligibility aspe
        ON aspe.service_plan_id = qli.service_plan_id
        AND aspe.addon_id = p_addon_id
      WHERE qli.quote_id = p_quote_id
      AND qli.service_plan_id IS NOT NULL
    ) INTO v_is_eligible;

    RETURN v_is_eligible;
  END IF;

  -- Default: not eligible
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION validate_addon_eligibility IS
'Validates if an add-on can be added to a quote based on the service plans in that quote';
