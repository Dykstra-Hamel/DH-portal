-- Add agent_id column to call_records table to track which agent handled each call
ALTER TABLE call_records ADD COLUMN agent_id VARCHAR(255);

-- Add foreign key constraint to agents table
ALTER TABLE call_records ADD CONSTRAINT fk_call_records_agent_id
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE SET NULL;

-- Create index for better performance on agent_id lookups
CREATE INDEX idx_call_records_agent_id ON call_records(agent_id);

-- Update existing call_records to set agent_id from retell_variables if available
-- This is a best-effort migration for existing data
UPDATE call_records
SET agent_id = (retell_variables->>'agent_id')
WHERE retell_variables IS NOT NULL
  AND retell_variables->>'agent_id' IS NOT NULL
  AND retell_variables->>'agent_id' != ''
  AND agent_id IS NULL;

-- Alternative: try to extract from retell_variables using different possible field names
UPDATE call_records
SET agent_id = COALESCE(
  retell_variables->>'agent_id',
  retell_variables->>'llm_id',
  retell_variables->>'retell_llm_id'
)
WHERE retell_variables IS NOT NULL
  AND agent_id IS NULL
  AND (
    retell_variables->>'agent_id' IS NOT NULL OR
    retell_variables->>'llm_id' IS NOT NULL OR
    retell_variables->>'retell_llm_id' IS NOT NULL
  );