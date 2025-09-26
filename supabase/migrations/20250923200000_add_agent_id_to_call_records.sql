-- Add agent_id column to call_records table to track which agent handled the call
ALTER TABLE call_records
ADD COLUMN IF NOT EXISTS agent_id VARCHAR(255);

-- Add foreign key constraint to reference agents table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_call_records_agent_id') THEN
        ALTER TABLE call_records
        ADD CONSTRAINT fk_call_records_agent_id
        FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_call_records_agent_id ON call_records(agent_id);

-- Update RLS policies to include agent_id access
-- Users can view call records for agents in their companies
DROP POLICY IF EXISTS "call_records_user_company_access" ON call_records;
CREATE POLICY "call_records_user_company_access" ON call_records
  FOR SELECT USING (
    -- Allow access if user has access to the lead's company
    (lead_id IS NOT NULL AND lead_id IN (
      SELECT l.id FROM leads l
      JOIN user_companies uc ON l.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
    ))
    OR
    -- Allow access if user has access to the customer's company
    (customer_id IS NOT NULL AND customer_id IN (
      SELECT c.id FROM customers c
      JOIN user_companies uc ON c.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
    ))
    OR
    -- Allow access if user has access to the agent's company
    (agent_id IS NOT NULL AND agent_id IN (
      SELECT a.agent_id FROM agents a
      JOIN user_companies uc ON a.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
    ))
  );