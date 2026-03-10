-- Step 1: Create proof_groups table
CREATE TABLE proof_groups (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proof_groups_project_id ON proof_groups(project_id);

ALTER TABLE proof_groups ENABLE ROW LEVEL SECURITY;

-- Step 2: RLS policy (mirrors project_proofs pattern)
CREATE POLICY "project_members_can_view_proof_groups" ON proof_groups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = proof_groups.project_id
    AND (
      p.requested_by = auth.uid() OR p.assigned_to = auth.uid()
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
    )
  ));

-- Step 3: Migrate existing proofs — one group per project
INSERT INTO proof_groups (id, project_id, name, created_at, updated_at)
SELECT gen_random_uuid(), project_id, 'Main Proof', MIN(created_at), NOW()
FROM project_proofs
GROUP BY project_id;

-- Step 4: Add group_id to project_proofs (nullable for backfill)
ALTER TABLE project_proofs
  ADD COLUMN group_id UUID REFERENCES proof_groups(id) ON DELETE CASCADE;

-- Step 5: Backfill group_id
UPDATE project_proofs pp
SET group_id = pg.id
FROM proof_groups pg
WHERE pg.project_id = pp.project_id;

-- Step 6: Make NOT NULL, update indexes
ALTER TABLE project_proofs ALTER COLUMN group_id SET NOT NULL;

DROP INDEX IF EXISTS idx_project_proofs_one_current;

CREATE UNIQUE INDEX idx_proof_groups_one_current
  ON project_proofs(group_id) WHERE is_current = TRUE;

CREATE INDEX idx_project_proofs_group_id ON project_proofs(group_id);
