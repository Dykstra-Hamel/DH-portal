-- Create company_discounts table for managing per-company discount configurations
CREATE TABLE company_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Basic Configuration
    discount_name TEXT NOT NULL,  -- Shows in dropdown: "Summer Special - 15% Off"
    description TEXT,  -- Optional internal notes
    is_active BOOLEAN DEFAULT true,

    -- Discount Type & Value
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),

    -- Price Application (default to initial only)
    applies_to_price TEXT NOT NULL DEFAULT 'initial'
        CHECK (applies_to_price IN ('initial', 'recurring', 'both')),

    -- Plan Targeting
    applies_to_plans TEXT NOT NULL DEFAULT 'all'
        CHECK (applies_to_plans IN ('all', 'specific')),
    eligible_plan_ids UUID[] DEFAULT ARRAY[]::UUID[],

    -- Access Control
    requires_manager BOOLEAN DEFAULT false,  -- If true, only managers can apply

    -- Time Restrictions
    time_restriction_type TEXT NOT NULL DEFAULT 'none'
        CHECK (time_restriction_type IN ('none', 'seasonal', 'limited_time')),

    -- For seasonal discounts (repeats yearly)
    seasonal_start_month INTEGER CHECK (seasonal_start_month BETWEEN 1 AND 12),
    seasonal_start_day INTEGER CHECK (seasonal_start_day BETWEEN 1 AND 31),
    seasonal_end_month INTEGER CHECK (seasonal_end_month BETWEEN 1 AND 12),
    seasonal_end_day INTEGER CHECK (seasonal_end_day BETWEEN 1 AND 31),

    -- For limited time discounts (one-time expiration)
    limited_time_start TIMESTAMPTZ,
    limited_time_end TIMESTAMPTZ,

    -- Display Order
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT check_seasonal_dates CHECK (
        time_restriction_type != 'seasonal' OR
        (seasonal_start_month IS NOT NULL AND seasonal_start_day IS NOT NULL AND
         seasonal_end_month IS NOT NULL AND seasonal_end_day IS NOT NULL)
    ),
    CONSTRAINT check_limited_time_dates CHECK (
        time_restriction_type != 'limited_time' OR
        (limited_time_start IS NOT NULL AND limited_time_end IS NOT NULL AND
         limited_time_start < limited_time_end)
    )
);

-- Indexes for performance
CREATE INDEX idx_company_discounts_company_id ON company_discounts(company_id);
CREATE INDEX idx_company_discounts_active ON company_discounts(is_active) WHERE is_active = true;
CREATE INDEX idx_company_discounts_sort ON company_discounts(company_id, sort_order);

-- Helper function to check if a discount is currently available
CREATE OR REPLACE FUNCTION is_discount_available(
    p_discount_id UUID,
    p_plan_id UUID,
    p_user_is_manager BOOLEAN,
    p_check_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
DECLARE
    v_discount company_discounts;
    v_check_month INTEGER;
    v_check_day INTEGER;
    v_is_in_season BOOLEAN;
BEGIN
    SELECT * INTO v_discount FROM company_discounts WHERE id = p_discount_id;

    -- Check if discount exists and is active
    IF v_discount IS NULL OR NOT v_discount.is_active THEN
        RETURN false;
    END IF;

    -- Check manager requirement
    IF v_discount.requires_manager AND NOT p_user_is_manager THEN
        RETURN false;
    END IF;

    -- Check plan eligibility
    IF v_discount.applies_to_plans = 'specific' AND
       NOT (p_plan_id = ANY(v_discount.eligible_plan_ids)) THEN
        RETURN false;
    END IF;

    -- Check time restrictions
    IF v_discount.time_restriction_type = 'seasonal' THEN
        v_check_month := EXTRACT(MONTH FROM p_check_date);
        v_check_day := EXTRACT(DAY FROM p_check_date);

        -- Check if current date falls within seasonal range
        -- Handle year-wrap (e.g., Dec 15 - Jan 15)
        IF v_discount.seasonal_start_month <= v_discount.seasonal_end_month THEN
            -- Same year range (e.g., June 1 - Aug 31)
            v_is_in_season := (
                (v_check_month > v_discount.seasonal_start_month OR
                 (v_check_month = v_discount.seasonal_start_month AND v_check_day >= v_discount.seasonal_start_day))
                AND
                (v_check_month < v_discount.seasonal_end_month OR
                 (v_check_month = v_discount.seasonal_end_month AND v_check_day <= v_discount.seasonal_end_day))
            );
        ELSE
            -- Year-wrap range (e.g., Dec 15 - Jan 15)
            v_is_in_season := (
                (v_check_month > v_discount.seasonal_start_month OR
                 (v_check_month = v_discount.seasonal_start_month AND v_check_day >= v_discount.seasonal_start_day))
                OR
                (v_check_month < v_discount.seasonal_end_month OR
                 (v_check_month = v_discount.seasonal_end_month AND v_check_day <= v_discount.seasonal_end_day))
            );
        END IF;

        IF NOT v_is_in_season THEN
            RETURN false;
        END IF;
    ELSIF v_discount.time_restriction_type = 'limited_time' THEN
        IF p_check_date < v_discount.limited_time_start OR
           p_check_date > v_discount.limited_time_end THEN
            RETURN false;
        END IF;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE company_discounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view discounts for their company
CREATE POLICY "Users can view company discounts"
    ON company_discounts FOR SELECT
    USING (
        company_id IN (
            SELECT uc.company_id FROM user_companies uc
            WHERE uc.user_id = auth.uid()
        )
    );

-- Policy: Admins can manage discounts for their company
CREATE POLICY "Admins can manage company discounts"
    ON company_discounts FOR ALL
    USING (
        company_id IN (
            SELECT uc.company_id
            FROM user_companies uc
            JOIN profiles p ON p.id = uc.user_id
            WHERE uc.user_id = auth.uid()
            AND p.role IN ('admin', 'super_admin')
        )
    );
