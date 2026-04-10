CREATE TABLE comment_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('thumbs_up', 'smile', 'laugh', 'eyes', 'check')),
  project_comment_id UUID REFERENCES project_comments(id) ON DELETE CASCADE,
  task_comment_id UUID REFERENCES project_task_comments(id) ON DELETE CASCADE,
  monthly_service_comment_id UUID REFERENCES monthly_service_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_parent_comment CHECK (
    (project_comment_id IS NOT NULL AND task_comment_id IS NULL AND monthly_service_comment_id IS NULL) OR
    (project_comment_id IS NULL AND task_comment_id IS NOT NULL AND monthly_service_comment_id IS NULL) OR
    (project_comment_id IS NULL AND task_comment_id IS NULL AND monthly_service_comment_id IS NOT NULL)
  )
);

-- One reaction per emoji per user per comment (partial unique indexes)
CREATE UNIQUE INDEX idx_comment_reactions_unique_project
  ON comment_reactions (user_id, emoji, project_comment_id)
  WHERE project_comment_id IS NOT NULL;
CREATE UNIQUE INDEX idx_comment_reactions_unique_task
  ON comment_reactions (user_id, emoji, task_comment_id)
  WHERE task_comment_id IS NOT NULL;
CREATE UNIQUE INDEX idx_comment_reactions_unique_monthly
  ON comment_reactions (user_id, emoji, monthly_service_comment_id)
  WHERE monthly_service_comment_id IS NOT NULL;

CREATE INDEX idx_comment_reactions_project_comment ON comment_reactions (project_comment_id) WHERE project_comment_id IS NOT NULL;
CREATE INDEX idx_comment_reactions_task_comment ON comment_reactions (task_comment_id) WHERE task_comment_id IS NOT NULL;
CREATE INDEX idx_comment_reactions_monthly_comment ON comment_reactions (monthly_service_comment_id) WHERE monthly_service_comment_id IS NOT NULL;

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reactions" ON comment_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert own reactions" ON comment_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- Real-time: REPLICA IDENTITY FULL needed so DELETE payloads include all columns
ALTER TABLE comment_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE comment_reactions;
