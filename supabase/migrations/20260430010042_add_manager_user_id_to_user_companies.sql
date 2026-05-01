-- Hierarchical reporting: a user (in the context of one company) can have a
-- single manager. Nullable; companies that don't use the manager feature
-- behave identically to today.
ALTER TABLE user_companies
  ADD COLUMN IF NOT EXISTS manager_user_id UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enforce: a user cannot manage themselves.
ALTER TABLE user_companies
  DROP CONSTRAINT IF EXISTS user_companies_no_self_manage;
ALTER TABLE user_companies
  ADD CONSTRAINT user_companies_no_self_manage
    CHECK (manager_user_id IS NULL OR manager_user_id <> user_id);

-- Speed up "find direct reports" queries scoped to a company.
CREATE INDEX IF NOT EXISTS idx_user_companies_manager
  ON user_companies(company_id, manager_user_id)
  WHERE manager_user_id IS NOT NULL;
