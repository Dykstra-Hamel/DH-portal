CREATE TABLE project_proofs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_size   BIGINT NOT NULL,
  mime_type   TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  is_current  BOOLEAN NOT NULL DEFAULT TRUE,
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce exactly one current proof per project
CREATE UNIQUE INDEX idx_project_proofs_one_current
  ON project_proofs(project_id) WHERE is_current = TRUE;

CREATE INDEX idx_project_proofs_project_id ON project_proofs(project_id);
CREATE INDEX idx_project_proofs_created_at ON project_proofs(created_at DESC);

ALTER TABLE project_proofs ENABLE ROW LEVEL SECURITY;

-- Any project member can read proofs
CREATE POLICY "project_members_can_view_proofs" ON project_proofs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_proofs.project_id
    AND (
      p.requested_by = auth.uid() OR p.assigned_to = auth.uid()
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
    )
  ));

ALTER PUBLICATION supabase_realtime ADD TABLE project_proofs;
ALTER TABLE project_proofs REPLICA IDENTITY FULL;
