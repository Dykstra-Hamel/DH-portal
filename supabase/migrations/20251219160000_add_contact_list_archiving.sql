-- Add soft delete (archive) functionality to contact_lists
-- This allows lists to be archived instead of deleted, preserving historical campaign data

-- Add archived_at column to contact_lists table
ALTER TABLE contact_lists
ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

-- Add archived_by column to track who archived it
ALTER TABLE contact_lists
ADD COLUMN archived_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for filtering archived vs active lists
-- Partial index only for archived lists to improve query performance
CREATE INDEX idx_contact_lists_archived_at ON contact_lists(archived_at)
WHERE archived_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN contact_lists.archived_at IS 'When the list was archived (soft deleted). NULL = active, NOT NULL = archived';
COMMENT ON COLUMN contact_lists.archived_by IS 'User who archived the list';
