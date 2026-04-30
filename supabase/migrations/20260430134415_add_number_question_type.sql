-- Drop the existing CHECK constraint and re-add with 'number' included
ALTER TABLE sales_checklist_questions
  DROP CONSTRAINT IF EXISTS sales_checklist_questions_answer_type_check;

ALTER TABLE sales_checklist_questions
  ADD CONSTRAINT sales_checklist_questions_answer_type_check
  CHECK (answer_type IN ('yes_no', 'text', 'number'));

-- Add optional config columns (nullable — only used when answer_type = 'number')
ALTER TABLE sales_checklist_questions
  ADD COLUMN IF NOT EXISTS min_value NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_value NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS step_value NUMERIC DEFAULT NULL;
