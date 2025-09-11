-- Enable realtime for tickets table
alter publication supabase_realtime add table tickets;

-- Enable realtime for call_records table 
alter publication supabase_realtime add table call_records;

-- Set replica identity to full for better realtime performance
-- This allows subscribers to see all column values in updates
ALTER TABLE tickets REPLICA IDENTITY FULL;
ALTER TABLE call_records REPLICA IDENTITY FULL;