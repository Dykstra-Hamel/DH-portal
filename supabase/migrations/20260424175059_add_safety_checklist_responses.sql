ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS safety_checklist_responses JSONB DEFAULT '[]'::jsonb;
