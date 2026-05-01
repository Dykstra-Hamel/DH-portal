-- Cache the resolved branch on each service_address so repeat tickets/leads
-- at the same address don't re-resolve (and re-geocode) every time.
--
-- Pair semantics:
--   branch_resolved_at IS NULL                    -> not yet tried
--   branch_resolved_at IS NOT NULL, branch_id NULL -> tried, no service area covers it
--   branch_resolved_at IS NOT NULL, branch_id set  -> tried, matched this branch
--
-- Cache is invalidated by /api/service-areas POST/PUT clearing both columns
-- for the company.

ALTER TABLE service_addresses
  ADD COLUMN IF NOT EXISTS branch_id UUID
    REFERENCES branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS branch_resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_service_addresses_branch_id
  ON service_addresses(branch_id) WHERE branch_id IS NOT NULL;
