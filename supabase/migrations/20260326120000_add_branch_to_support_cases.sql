-- Add branch_id to support_cases
ALTER TABLE support_cases
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_support_cases_branch_id
  ON support_cases(branch_id);

-- Backfill from the linked ticket's branch where available
UPDATE support_cases sc
  SET branch_id = t.branch_id
  FROM tickets t
  WHERE sc.ticket_id = t.id
    AND t.branch_id IS NOT NULL
    AND sc.branch_id IS NULL;
