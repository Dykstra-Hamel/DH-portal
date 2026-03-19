-- Create system_sales_cadences table for global cadences not tied to a company
CREATE TABLE IF NOT EXISTS system_sales_cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  usage_count INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create system_sales_cadence_steps table for steps on system cadences
CREATE TABLE IF NOT EXISTS system_sales_cadence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id UUID NOT NULL REFERENCES system_sales_cadences(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  time_of_day TEXT NOT NULL,
  action_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create cadence_library_usage table for import tracking
CREATE TABLE IF NOT EXISTS cadence_library_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_cadence_id UUID NOT NULL REFERENCES system_sales_cadences(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  company_cadence_id UUID REFERENCES sales_cadences(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_sales_cadences_active ON system_sales_cadences(is_active);
CREATE INDEX IF NOT EXISTS idx_system_sales_cadences_featured ON system_sales_cadences(is_featured);
CREATE INDEX IF NOT EXISTS idx_system_sales_cadence_steps_cadence_id ON system_sales_cadence_steps(cadence_id);
CREATE INDEX IF NOT EXISTS idx_cadence_library_usage_library_cadence_id ON cadence_library_usage(library_cadence_id);
CREATE INDEX IF NOT EXISTS idx_cadence_library_usage_company_id ON cadence_library_usage(company_id);

-- Updated_at trigger for system_sales_cadences
CREATE OR REPLACE FUNCTION update_system_sales_cadences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_sales_cadences_updated_at
  BEFORE UPDATE ON system_sales_cadences
  FOR EACH ROW
  EXECUTE FUNCTION update_system_sales_cadences_updated_at();

-- RLS Policies
ALTER TABLE system_sales_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_sales_cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_library_usage ENABLE ROW LEVEL SECURITY;

-- Public read for active system cadences
CREATE POLICY "Public can read active system cadences"
  ON system_sales_cadences
  FOR SELECT
  USING (is_active = true);

-- Public read for steps of active system cadences
CREATE POLICY "Public can read steps of active system cadences"
  ON system_sales_cadence_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM system_sales_cadences
      WHERE id = system_sales_cadence_steps.cadence_id
        AND is_active = true
    )
  );

-- Admin-only write on system_sales_cadences
CREATE POLICY "Admins can manage system cadences"
  ON system_sales_cadences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Admin-only write on system_sales_cadence_steps
CREATE POLICY "Admins can manage system cadence steps"
  ON system_sales_cadence_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- Authenticated users can read cadence_library_usage
CREATE POLICY "Authenticated users can read cadence library usage"
  ON cadence_library_usage
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can insert cadence_library_usage
CREATE POLICY "Authenticated users can insert cadence library usage"
  ON cadence_library_usage
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
