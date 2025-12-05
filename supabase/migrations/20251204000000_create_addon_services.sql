-- Create add_on_services table
-- This table mirrors the service_plans structure but is for add-on services
-- that can only be selected alongside a base service plan

CREATE TABLE add_on_services (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Basic Info
  addon_name TEXT NOT NULL,
  addon_description TEXT,
  addon_category TEXT, -- 'basic', 'premium', 'specialty'

  -- Pricing Structure
  initial_price DECIMAL(10,2),
  recurring_price DECIMAL(10,2) NOT NULL,
  billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'semi-annually', 'annually')),
  initial_discount DECIMAL(10,2) DEFAULT 0.00,

  -- Size-Based Pricing (optional)
  home_size_pricing JSONB, -- { "initial_cost_per_interval": 20.00, "recurring_cost_per_interval": 10.00 }
  yard_size_pricing JSONB, -- { "initial_cost_per_interval": 25.00, "recurring_cost_per_interval": 15.00 }

  -- Service Details
  treatment_frequency TEXT CHECK (treatment_frequency IN ('monthly', 'bi-monthly', 'quarterly', 'on-demand')),
  includes_inspection BOOLEAN DEFAULT false,

  -- Display & Content
  addon_image_url TEXT,
  addon_disclaimer TEXT,
  addon_features JSONB, -- Array of feature strings
  display_order INTEGER DEFAULT 0,
  highlight_badge TEXT,
  color_scheme JSONB, -- {primary: '#color', secondary: '#color'}

  -- Eligibility Control (NEW)
  eligibility_mode TEXT NOT NULL DEFAULT 'all' CHECK (eligibility_mode IN ('all', 'specific')),
  -- 'all' = can be added to any service plan
  -- 'specific' = only eligible for plans listed in junction table

  -- Status
  is_active BOOLEAN DEFAULT true,
  requires_quote BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_addon_name CHECK (addon_name <> '')
);

-- Indexes for performance
CREATE INDEX idx_addon_services_company_id ON add_on_services(company_id);
CREATE INDEX idx_addon_services_active ON add_on_services(is_active) WHERE is_active = true;
CREATE INDEX idx_addon_services_display_order ON add_on_services(display_order);

-- Comments for documentation
COMMENT ON TABLE add_on_services IS
'Add-on services that can be purchased alongside base service plans';

COMMENT ON COLUMN add_on_services.eligibility_mode IS
'Determines which service plans this add-on can be added to. "all" = any plan, "specific" = only plans listed in addon_service_plan_eligibility junction table';

COMMENT ON COLUMN add_on_services.addon_features IS
'JSON array of feature strings, e.g., ["Feature 1", "Feature 2"]';

COMMENT ON COLUMN add_on_services.color_scheme IS
'JSON object with primary and secondary colors, e.g., {"primary": "#4CAF50", "secondary": "#8BC34A"}';

-- Row Level Security (RLS) Policies
ALTER TABLE add_on_services ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view add-ons for their company
CREATE POLICY "Users can view add-ons for their company"
  ON add_on_services FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can manage add-ons for their company
CREATE POLICY "Users can manage add-ons for their company"
  ON add_on_services FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at timestamp
CREATE TRIGGER set_updated_at_addon_services
  BEFORE UPDATE ON add_on_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
