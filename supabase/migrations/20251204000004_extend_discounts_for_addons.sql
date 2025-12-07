-- Extend company_discounts table to support add-on services
-- Allows discounts to be applied to add-ons with the same flexibility as service plans

-- Add column to specify if discount applies to add-ons
ALTER TABLE company_discounts
ADD COLUMN applies_to_addons BOOLEAN DEFAULT false;

-- Add column for eligible add-on IDs (similar to eligible_plan_ids)
ALTER TABLE company_discounts
ADD COLUMN eligible_addon_ids UUID[];

-- Add comments for documentation
COMMENT ON COLUMN company_discounts.applies_to_addons IS
'If true, this discount can be applied to add-on services';

COMMENT ON COLUMN company_discounts.eligible_addon_ids IS
'If applies_to_addons is true and applies_to_plans is specific, this array contains eligible add-on IDs';

-- Helper function: Check if a discount is available for a specific add-on
CREATE OR REPLACE FUNCTION is_discount_available_for_addon(
  p_discount_id UUID,
  p_addon_id UUID,
  p_user_is_manager BOOLEAN DEFAULT false,
  p_check_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_discount RECORD;
  v_is_within_time_restriction BOOLEAN;
BEGIN
  -- Get discount record
  SELECT * INTO v_discount
  FROM company_discounts
  WHERE id = p_discount_id;

  -- Check if discount exists
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if discount is active
  IF NOT v_discount.is_active THEN
    RETURN false;
  END IF;

  -- Check if discount applies to add-ons
  IF NOT v_discount.applies_to_addons THEN
    RETURN false;
  END IF;

  -- Check manager requirement
  IF v_discount.requires_manager AND NOT p_user_is_manager THEN
    RETURN false;
  END IF;

  -- Check if add-on is eligible (when applies_to_plans is 'specific')
  IF v_discount.applies_to_plans = 'specific' THEN
    IF NOT (p_addon_id = ANY(v_discount.eligible_addon_ids)) THEN
      RETURN false;
    END IF;
  END IF;

  -- Check time restrictions
  IF v_discount.time_restriction_type = 'seasonal' THEN
    -- Check if current date is within seasonal range
    v_is_within_time_restriction := (
      -- Compare month and day
      (
        v_discount.seasonal_start_month < v_discount.seasonal_end_month AND
        (
          EXTRACT(MONTH FROM p_check_date) > v_discount.seasonal_start_month OR
          (EXTRACT(MONTH FROM p_check_date) = v_discount.seasonal_start_month AND EXTRACT(DAY FROM p_check_date) >= v_discount.seasonal_start_day)
        ) AND
        (
          EXTRACT(MONTH FROM p_check_date) < v_discount.seasonal_end_month OR
          (EXTRACT(MONTH FROM p_check_date) = v_discount.seasonal_end_month AND EXTRACT(DAY FROM p_check_date) <= v_discount.seasonal_end_day)
        )
      ) OR
      -- Handle year wrap (e.g., Nov 1 to Jan 31)
      (
        v_discount.seasonal_start_month > v_discount.seasonal_end_month AND
        (
          (
            EXTRACT(MONTH FROM p_check_date) > v_discount.seasonal_start_month OR
            (EXTRACT(MONTH FROM p_check_date) = v_discount.seasonal_start_month AND EXTRACT(DAY FROM p_check_date) >= v_discount.seasonal_start_day)
          ) OR
          (
            EXTRACT(MONTH FROM p_check_date) < v_discount.seasonal_end_month OR
            (EXTRACT(MONTH FROM p_check_date) = v_discount.seasonal_end_month AND EXTRACT(DAY FROM p_check_date) <= v_discount.seasonal_end_day)
          )
        )
      )
    );

    IF NOT v_is_within_time_restriction THEN
      RETURN false;
    END IF;
  ELSIF v_discount.time_restriction_type = 'limited_time' THEN
    -- Check if current date is within limited time range
    IF p_check_date < v_discount.limited_time_start OR p_check_date > v_discount.limited_time_end THEN
      RETURN false;
    END IF;
  END IF;

  -- All checks passed
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_discount_available_for_addon IS
'Validates if a discount is available for a specific add-on based on eligibility, manager requirements, and time restrictions';
