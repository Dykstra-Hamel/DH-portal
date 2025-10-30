-- Migration: Add Composite Indexes for Commonly Filtered Queries
-- Purpose: Optimize queries that filter by company_id, status, archived with ORDER BY created_at
-- Impact: Should improve filtered list queries with sorting

-- Composite index for call_records
-- Supports: WHERE company_id = X AND archived = X ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_call_records_company_archived_created
  ON call_records(company_id, archived, created_at DESC)
  WHERE company_id IS NOT NULL;

-- Composite index for tickets with status filtering
-- Supports: WHERE company_id = X AND status IN (...) AND archived = X ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_tickets_company_status_archived_created
  ON tickets(company_id, status, archived, created_at DESC)
  WHERE company_id IS NOT NULL;

-- Alternative index for tickets when filtering only by company and archived
CREATE INDEX IF NOT EXISTS idx_tickets_company_archived_created
  ON tickets(company_id, archived, created_at DESC)
  WHERE company_id IS NOT NULL;

-- Composite index for leads (similar pattern observed in codebase)
-- Supports: WHERE company_id = X AND archived = X ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_leads_company_archived_created
  ON leads(company_id, archived, created_at DESC)
  WHERE company_id IS NOT NULL AND archived IS NOT NULL;

-- Composite index for support_cases (similar pattern)
-- Supports: WHERE company_id = X AND archived = X ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_support_cases_company_archived_created
  ON support_cases(company_id, archived, created_at DESC)
  WHERE company_id IS NOT NULL;

-- Composite index for tasks (similar pattern)
-- Supports: WHERE company_id = X AND archived = X ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_tasks_company_archived_created
  ON tasks(company_id, archived, created_at DESC)
  WHERE company_id IS NOT NULL;

-- Add index for assigned_to filtering (used in "My Tasks", "My Leads", etc.)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_company_status
  ON tasks(assigned_to, company_id, status)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_company
  ON leads(assigned_to, company_id)
  WHERE assigned_to IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_call_records_company_archived_created IS
  'Performance: Optimizes filtered call_records queries with company_id and archived filtering plus created_at sorting';

COMMENT ON INDEX idx_tickets_company_status_archived_created IS
  'Performance: Optimizes tickets queries filtering by company, status, and archived with created_at sorting';

COMMENT ON INDEX idx_tickets_company_archived_created IS
  'Performance: Optimizes tickets queries filtering by company and archived with created_at sorting';

COMMENT ON INDEX idx_leads_company_archived_created IS
  'Performance: Optimizes leads queries filtering by company and archived with created_at sorting';

COMMENT ON INDEX idx_support_cases_company_archived_created IS
  'Performance: Optimizes support_cases queries filtering by company and archived with created_at sorting';

COMMENT ON INDEX idx_tasks_company_archived_created IS
  'Performance: Optimizes tasks queries filtering by company and archived with created_at sorting';

COMMENT ON INDEX idx_tasks_assigned_to_company_status IS
  'Performance: Optimizes My Tasks page queries filtering by assigned user';

COMMENT ON INDEX idx_leads_assigned_to_company IS
  'Performance: Optimizes My Sales Leads page queries filtering by assigned user';
