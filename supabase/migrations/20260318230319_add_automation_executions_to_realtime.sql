-- Enable Supabase Realtime postgres_changes for automation_executions.
-- This allows the lead detail UI to subscribe to execution updates
-- (step progress, completion, cancellation) without polling.
ALTER PUBLICATION supabase_realtime ADD TABLE automation_executions;
