-- Add missing cancellation fields to automation_workflows table

-- Add auto_cancel_on_status column
ALTER TABLE automation_workflows 
ADD COLUMN IF NOT EXISTS auto_cancel_on_status BOOLEAN DEFAULT true;

-- Add cancel_on_statuses column  
ALTER TABLE automation_workflows 
ADD COLUMN IF NOT EXISTS cancel_on_statuses JSONB DEFAULT '["won", "closed_won", "converted"]';

-- Update existing workflows to have the default cancellation settings
UPDATE automation_workflows 
SET 
    auto_cancel_on_status = true,
    cancel_on_statuses = '["won", "closed_won", "converted"]'
WHERE 
    auto_cancel_on_status IS NULL 
    OR cancel_on_statuses IS NULL;

-- Add helpful comments
COMMENT ON COLUMN automation_workflows.auto_cancel_on_status IS 'Automatically cancel workflow when lead reaches terminal status';
COMMENT ON COLUMN automation_workflows.cancel_on_statuses IS 'Array of lead statuses that trigger workflow cancellation';