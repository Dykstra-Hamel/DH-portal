CREATE TABLE IF NOT EXISTS specialty_plan_lines (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id        UUID NOT NULL REFERENCES service_plans(id) ON DELETE CASCADE,
  line_name      TEXT NOT NULL,
  pricing_type   TEXT NOT NULL DEFAULT 'per_linear_foot'
                   CHECK (pricing_type IN ('per_linear_foot', 'flat', 'per_hour')),
  price_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_price  DECIMAL(10,2),
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast plan lookups
CREATE INDEX IF NOT EXISTS idx_specialty_plan_lines_plan_id ON specialty_plan_lines(plan_id);

-- Trigger for updated_at (reuse existing update_updated_at_column function)
CREATE TRIGGER update_specialty_plan_lines_updated_at
  BEFORE UPDATE ON specialty_plan_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE specialty_plan_lines ENABLE ROW LEVEL SECURITY;

-- RLS: same company membership check used by plan_pest_coverage
CREATE POLICY "Users can view specialty lines for their company plans"
  ON specialty_plan_lines FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM service_plans sp
      JOIN user_companies uc ON uc.company_id = sp.company_id
      WHERE sp.id = specialty_plan_lines.plan_id AND uc.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage specialty lines for their company plans"
  ON specialty_plan_lines FOR ALL USING (
    EXISTS (
      SELECT 1 FROM service_plans sp
      JOIN user_companies uc ON uc.company_id = sp.company_id
      WHERE sp.id = specialty_plan_lines.plan_id AND uc.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
