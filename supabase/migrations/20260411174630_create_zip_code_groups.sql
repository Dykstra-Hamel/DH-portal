-- =====================================================================
-- Migration: 20260411174630_create_zip_code_groups
-- =====================================================================
--
-- Creates zip_code_groups table for organizing zip codes into named
-- groups with an optional assigned user. Lays groundwork for future
-- auto-assignment without implementing auto-assignment logic.
--
-- Groups coexist alongside the existing flat zip code list in
-- widget_config.service_areas.
-- =====================================================================

CREATE TABLE IF NOT EXISTS zip_code_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  zip_codes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zip_code_groups_company_id ON zip_code_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_zip_code_groups_assigned_user ON zip_code_groups(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_zip_code_groups_zip_codes ON zip_code_groups USING GIN(zip_codes);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION public.set_zip_code_groups_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_zip_code_groups_updated_at
  BEFORE UPDATE ON zip_code_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.set_zip_code_groups_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================

ALTER TABLE zip_code_groups ENABLE ROW LEVEL SECURITY;

-- Company members can read groups for their company
CREATE POLICY "zip_code_groups_select" ON zip_code_groups
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = (SELECT auth.uid())
    )
  );

-- Only admins/managers can insert groups
CREATE POLICY "zip_code_groups_insert" ON zip_code_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = (SELECT auth.uid())
        AND uc.role IN ('admin', 'manager')
    )
  );

-- Only admins/managers can update groups
CREATE POLICY "zip_code_groups_update" ON zip_code_groups
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = (SELECT auth.uid())
        AND uc.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = (SELECT auth.uid())
        AND uc.role IN ('admin', 'manager')
    )
  );

-- Only admins/managers can delete groups
CREATE POLICY "zip_code_groups_delete" ON zip_code_groups
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = (SELECT auth.uid())
        AND uc.role IN ('admin', 'manager')
    )
  );
