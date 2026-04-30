ALTER TABLE sales_checklist_questions
  DROP CONSTRAINT IF EXISTS sales_checklist_questions_answer_type_check;

ALTER TABLE sales_checklist_questions
  ADD CONSTRAINT sales_checklist_questions_answer_type_check
  CHECK (answer_type IN ('yes_no', 'text', 'number', 'dropdown'));

ALTER TABLE sales_checklist_questions
  ADD COLUMN IF NOT EXISTS dropdown_options text[] DEFAULT NULL;
