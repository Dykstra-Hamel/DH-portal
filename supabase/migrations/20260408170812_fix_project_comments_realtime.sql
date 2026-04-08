-- Enable real-time for project_comments table.
-- REPLICA IDENTITY FULL is required for column-filtered subscriptions
-- (filter: project_id=eq.{id}) to work on UPDATE and DELETE events.
ALTER TABLE project_comments REPLICA IDENTITY FULL;

-- Add table to the supabase_realtime publication (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'project_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_comments;
  END IF;
END $$;
