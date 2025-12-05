-- Create addon_service_plan_eligibility junction table
-- Defines which service plans each add-on can be added to
-- Only relevant when add_on_services.eligibility_mode = 'specific'

CREATE TABLE addon_service_plan_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id UUID NOT NULL REFERENCES add_on_services(id) ON DELETE CASCADE,
  service_plan_id UUID NOT NULL REFERENCES service_plans(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate entries
  CONSTRAINT unique_addon_plan_eligibility UNIQUE (addon_id, service_plan_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_addon_eligibility_addon_id ON addon_service_plan_eligibility(addon_id);
CREATE INDEX idx_addon_eligibility_plan_id ON addon_service_plan_eligibility(service_plan_id);
CREATE INDEX idx_addon_eligibility_lookup ON addon_service_plan_eligibility(addon_id, service_plan_id);

-- Comments for documentation
COMMENT ON TABLE addon_service_plan_eligibility IS
'Junction table defining which service plans each add-on service can be added to. Only used when add_on_services.eligibility_mode = "specific"';

COMMENT ON COLUMN addon_service_plan_eligibility.addon_id IS
'Reference to the add-on service';

COMMENT ON COLUMN addon_service_plan_eligibility.service_plan_id IS
'Reference to the service plan that this add-on is eligible for';

-- Row Level Security (RLS) Policies
ALTER TABLE addon_service_plan_eligibility ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view eligibility for their company's add-ons
CREATE POLICY "Users can view eligibility for their company"
  ON addon_service_plan_eligibility FOR SELECT
  TO authenticated
  USING (
    addon_id IN (
      SELECT id FROM add_on_services
      WHERE company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can manage eligibility for their company's add-ons
CREATE POLICY "Users can manage eligibility for their company"
  ON addon_service_plan_eligibility FOR ALL
  TO authenticated
  USING (
    addon_id IN (
      SELECT id FROM add_on_services
      WHERE company_id IN (
        SELECT company_id FROM user_companies WHERE user_id = auth.uid()
      )
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
