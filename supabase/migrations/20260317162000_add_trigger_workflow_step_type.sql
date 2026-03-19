-- Migration: Add trigger_workflow step type to sales cadence system

-- 1. Add workflow_id to sales_cadence_steps (FK to automation_workflows)
ALTER TABLE sales_cadence_steps
  ADD COLUMN workflow_id UUID REFERENCES automation_workflows(id) ON DELETE SET NULL;

-- 2. Drop old action_type check constraint and re-add with trigger_workflow included
ALTER TABLE sales_cadence_steps
  DROP CONSTRAINT IF EXISTS sales_cadence_steps_action_type_check;

ALTER TABLE sales_cadence_steps
  ADD CONSTRAINT sales_cadence_steps_action_type_check
  CHECK (action_type IN ('live_call', 'outbound_call', 'text_message', 'ai_call', 'email', 'trigger_workflow'));

-- 3. Add workflow_id to system_sales_cadence_steps (no FK — workflows are company-specific)
ALTER TABLE system_sales_cadence_steps
  ADD COLUMN workflow_id UUID;

-- 4. Add cadence tracking columns to automation_executions
--    These allow the workflow executor to know which cadence step to complete on finish
ALTER TABLE automation_executions
  ADD COLUMN cadence_step_id UUID REFERENCES sales_cadence_steps(id) ON DELETE SET NULL,
  ADD COLUMN cadence_lead_id  UUID REFERENCES leads(id) ON DELETE SET NULL;
