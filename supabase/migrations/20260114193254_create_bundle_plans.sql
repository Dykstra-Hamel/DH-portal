-- Create bundle_plans table for pre-packaged service bundles

CREATE TABLE IF NOT EXISTS bundle_plans (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Basic Info
  bundle_name TEXT NOT NULL,
  bundle_description TEXT,
  bundle_category TEXT, -- 'starter', 'premium', 'ultimate', etc.

  -- Bundled Items (JSONB arrays storing references)
  bundled_service_plans JSONB DEFAULT '[]'::jsonb,
    -- Array of {service_plan_id: uuid, plan_name: string} objects
  bundled_add_ons JSONB DEFAULT '[]'::jsonb,
    -- Array of {add_on_id: uuid, addon_name: string} objects

  -- Pricing Strategy
  pricing_type TEXT CHECK (pricing_type IN ('custom', 'discount')) NOT NULL,
    -- 'custom': Use custom_initial_price and custom_recurring_price
    -- 'discount': Calculate from component prices and apply discount

  -- Custom Pricing (used when pricing_type = 'custom')
  custom_initial_price DECIMAL(10,2),
  custom_recurring_price DECIMAL(10,2),

  -- Discount Pricing (used when pricing_type = 'discount')
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2),

  -- Billing
  billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'semi-annually', 'annually')),

  -- Display & Content
  bundle_features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings
  bundle_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  highlight_badge TEXT, -- 'Best Deal', 'Most Popular', 'Save 20%'

  -- Status & Timestamps
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_bundle_plans_company_id ON bundle_plans(company_id);
CREATE INDEX idx_bundle_plans_is_active ON bundle_plans(is_active);
CREATE INDEX idx_bundle_plans_display_order ON bundle_plans(display_order);

-- Add RLS policies
ALTER TABLE bundle_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view active bundles for their company
CREATE POLICY "Users can view bundles for their company" ON bundle_plans
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can insert bundles for their company
CREATE POLICY "Admins can insert bundles for their company" ON bundle_plans
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policy: Admins can update bundles for their company
CREATE POLICY "Admins can update bundles for their company" ON bundle_plans
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policy: Admins can delete bundles for their company
CREATE POLICY "Admins can delete bundles for their company" ON bundle_plans
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM user_companies
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Add comment
COMMENT ON TABLE bundle_plans IS 'Pre-packaged bundles of service plans and add-ons with custom pricing or discounts';
