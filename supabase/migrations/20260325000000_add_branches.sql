-- ============================================================
-- Branches: optional organizational sub-units within a company
-- ============================================================

-- 1. branches table
CREATE TABLE IF NOT EXISTS branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_company_name
  ON branches(company_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_branches_company_id
  ON branches(company_id);

-- Only one primary branch per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_company_primary
  ON branches(company_id) WHERE is_primary = true;

COMMENT ON TABLE branches IS
  'Optional sub-units within a company (e.g., geographic offices). '
  'Companies without rows here behave exactly as before.';

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_branches_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_branches_updated_at ON branches;
CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_branches_updated_at();

-- 2. user_branch_assignments junction table
--    No rows for a user = sees all branches (unrestricted).
--    Rows present = restricted to those branches + unassigned records.
--    Only global app admins (profiles.role = 'admin') bypass this entirely.
CREATE TABLE IF NOT EXISTS user_branch_assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id  UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_user_branch_assignments_user_company
  ON user_branch_assignments(user_id, company_id);

CREATE INDEX IF NOT EXISTS idx_user_branch_assignments_branch_id
  ON user_branch_assignments(branch_id);

COMMENT ON TABLE user_branch_assignments IS
  'When a user has rows here they are restricted to those branches. '
  'Empty = unrestricted. Global admins bypass this entirely.';

-- 3. Add optional branch_id FK to related tables
ALTER TABLE service_areas
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_service_areas_branch_id
  ON service_areas(branch_id);

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_branch_id
  ON leads(branch_id);

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_branch_id
  ON tickets(branch_id);

ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_form_submissions_branch_id
  ON form_submissions(branch_id);

ALTER TABLE partial_leads
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partial_leads_branch_id
  ON partial_leads(branch_id);

-- call_records derives branch through lead_id → leads.branch_id; no direct column needed.

-- 4. RLS policies
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY branches_select ON branches
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_companies WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Writes go through the admin client (service role) from API routes — RLS is a safety net
CREATE POLICY branches_all_service_role ON branches
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE user_branch_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY uba_select ON user_branch_assignments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY uba_all_service_role ON user_branch_assignments
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
