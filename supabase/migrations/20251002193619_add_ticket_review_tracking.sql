-- Add ticket review tracking fields to prevent simultaneous editing conflicts
-- These fields track when a user is actively reviewing a ticket in the modal

ALTER TABLE tickets
ADD COLUMN reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN reviewed_at timestamp with time zone,
ADD COLUMN review_expires_at timestamp with time zone;

-- Add index for faster lookups of tickets being reviewed
CREATE INDEX idx_tickets_reviewed_by ON tickets(reviewed_by) WHERE reviewed_by IS NOT NULL;

-- Add index for cleaning up expired reviews
CREATE INDEX idx_tickets_review_expires_at ON tickets(review_expires_at) WHERE review_expires_at IS NOT NULL;

-- Comment the new columns
COMMENT ON COLUMN tickets.reviewed_by IS 'User currently reviewing this ticket in the modal';
COMMENT ON COLUMN tickets.reviewed_at IS 'Timestamp when review started';
COMMENT ON COLUMN tickets.review_expires_at IS 'Auto-expire review lock after this time (prevents stuck locks from crashes)';
