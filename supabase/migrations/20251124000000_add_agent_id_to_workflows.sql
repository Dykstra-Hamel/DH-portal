-- Add agent_id to automation_workflows table for workflow-specific Retell agents

-- Add agent_id column as UUID to match agents.id type
ALTER TABLE automation_workflows ADD COLUMN IF NOT EXISTS agent_id UUID;

-- Add foreign key constraint to agents table
ALTER TABLE automation_workflows ADD CONSTRAINT fk_workflows_agent
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_workflows_agent_id ON automation_workflows(agent_id);

-- Add comment
COMMENT ON COLUMN automation_workflows.agent_id IS 'Optional Retell agent to use for phone calls in this workflow. If null, uses company default outbound agent.';
