-- Add form_submission_id to tickets table to make the relationship bidirectional
-- This enables efficient waterfall source lookup for pest pressure deduplication

-- Add form_submission_id column (nullable since not all tickets come from forms)
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS form_submission_id UUID REFERENCES form_submissions(id) ON DELETE SET NULL;

-- Backfill existing records where form_submissions.ticket_id points to tickets
UPDATE tickets
SET form_submission_id = form_submissions.id
FROM form_submissions
WHERE form_submissions.ticket_id = tickets.id
  AND tickets.form_submission_id IS NULL;

-- Create index for query performance
CREATE INDEX IF NOT EXISTS idx_tickets_form_submission_id ON tickets(form_submission_id);

-- Add helpful comment
COMMENT ON COLUMN tickets.form_submission_id IS 'Bidirectional link to form_submissions. Used for pest pressure source tracking (form → ticket → lead hierarchy).';

-- Note: This creates a bidirectional relationship with form_submissions
-- form_submissions.ticket_id -> tickets.id (existing)
-- tickets.form_submission_id -> form_submissions.id (new)
-- Both can exist because conversion can happen in either direction
