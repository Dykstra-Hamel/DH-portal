CREATE TABLE proof_feedback (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proof_id    UUID NOT NULL REFERENCES project_proofs(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  x_percent   REAL NOT NULL CHECK (x_percent >= 0 AND x_percent <= 1),
  y_percent   REAL NOT NULL CHECK (y_percent >= 0 AND y_percent <= 1),
  page_number INTEGER NOT NULL DEFAULT 1 CHECK (page_number >= 1),
  comment     TEXT NOT NULL,
  pin_number  INTEGER NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proof_feedback_proof_id   ON proof_feedback(proof_id);
CREATE INDEX idx_proof_feedback_project_id ON proof_feedback(project_id);

ALTER TABLE proof_feedback ENABLE ROW LEVEL SECURITY;

-- All project members (including clients) can read feedback
CREATE POLICY "project_members_can_view_proof_feedback" ON proof_feedback FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = proof_feedback.project_id
    AND (
      p.requested_by = auth.uid() OR p.assigned_to = auth.uid()
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
    )
  ));

CREATE POLICY "project_members_can_insert_proof_feedback" ON proof_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM projects p WHERE p.id = proof_feedback.project_id
    AND (
      p.requested_by = auth.uid() OR p.assigned_to = auth.uid()
      OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin')
    )
  ));

CREATE POLICY "author_or_admin_can_update_proof_feedback" ON proof_feedback FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "author_or_admin_can_delete_proof_feedback" ON proof_feedback FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE proof_feedback;
ALTER TABLE proof_feedback REPLICA IDENTITY FULL;
