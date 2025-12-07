-- Enable realtime for remaining tables needed by useRealtimeCounts hook
-- This fixes secondary navigation counts not updating in real-time

-- Enable realtime for leads table (affects Sales Leads, Scheduling, My Sales Leads counts)
ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- Enable realtime for support_cases table (affects Customer Service, My Support Cases counts)
ALTER PUBLICATION supabase_realtime ADD TABLE support_cases;

-- Enable realtime for customers table (affects customer counts)
ALTER PUBLICATION supabase_realtime ADD TABLE customers;

-- Set replica identity to full for better realtime performance
-- This allows subscribers to see all column values in updates, needed for filtering
ALTER TABLE leads REPLICA IDENTITY FULL;
ALTER TABLE support_cases REPLICA IDENTITY FULL;
ALTER TABLE customers REPLICA IDENTITY FULL;

-- Add comments documenting the realtime setup
COMMENT ON TABLE leads IS 'Realtime enabled for live count updates in secondary navigation';
COMMENT ON TABLE support_cases IS 'Realtime enabled for live count updates in secondary navigation';
COMMENT ON TABLE customers IS 'Realtime enabled for live count updates in secondary navigation';