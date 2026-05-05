-- Add lead review tracking fields to prevent simultaneous editing conflicts.
-- Mirrors the ticket review-lock system (20251002193619_add_ticket_review_tracking.sql)
-- so leads can be locked while one user has the detail page open.

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS review_expires_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_leads_reviewed_by
  ON leads(reviewed_by) WHERE reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_review_expires_at
  ON leads(review_expires_at) WHERE review_expires_at IS NOT NULL;

COMMENT ON COLUMN leads.reviewed_by IS
  'User currently viewing this lead in the detail page or modal';
COMMENT ON COLUMN leads.reviewed_at IS 'Timestamp when review started';
COMMENT ON COLUMN leads.review_expires_at IS
  'Auto-expire review lock after this time (prevents stuck locks from crashes)';
