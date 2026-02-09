-- Create monthly_service_comments table for comments on monthly services
CREATE TABLE IF NOT EXISTS monthly_service_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_service_id UUID NOT NULL REFERENCES monthly_services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_monthly_service_comments_service_id ON monthly_service_comments(monthly_service_id);
CREATE INDEX idx_monthly_service_comments_user_id ON monthly_service_comments(user_id);
CREATE INDEX idx_monthly_service_comments_created_at ON monthly_service_comments(created_at DESC);

-- Enable RLS
ALTER TABLE monthly_service_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_service_comments

-- Admins can view all monthly service comments in their companies
CREATE POLICY "Admins can view monthly service comments in their companies"
  ON monthly_service_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM monthly_services
      JOIN user_companies ON user_companies.company_id = monthly_services.company_id
      WHERE monthly_services.id = monthly_service_comments.monthly_service_id
      AND user_companies.user_id = auth.uid()
    )
  );

-- Admins can create comments on monthly services in their companies
CREATE POLICY "Admins can create monthly service comments in their companies"
  ON monthly_service_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM monthly_services
      JOIN user_companies ON user_companies.company_id = monthly_services.company_id
      WHERE monthly_services.id = monthly_service_comments.monthly_service_id
      AND user_companies.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own monthly service comments"
  ON monthly_service_comments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own monthly service comments"
  ON monthly_service_comments
  FOR DELETE
  USING (user_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_service_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monthly_service_comments_updated_at
  BEFORE UPDATE ON monthly_service_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_service_comments_updated_at();

-- Add monthly_service_comment_id column to comment_attachments table
ALTER TABLE comment_attachments
ADD COLUMN IF NOT EXISTS monthly_service_comment_id UUID REFERENCES monthly_service_comments(id) ON DELETE CASCADE;

-- Update the constraint to allow monthly service comments
ALTER TABLE comment_attachments DROP CONSTRAINT IF EXISTS one_parent_comment;

ALTER TABLE comment_attachments ADD CONSTRAINT one_parent_comment CHECK (
    (project_comment_id IS NOT NULL AND task_comment_id IS NULL AND monthly_service_comment_id IS NULL) OR
    (project_comment_id IS NULL AND task_comment_id IS NOT NULL AND monthly_service_comment_id IS NULL) OR
    (project_comment_id IS NULL AND task_comment_id IS NULL AND monthly_service_comment_id IS NOT NULL)
);

-- Add index for monthly service comment attachments
CREATE INDEX IF NOT EXISTS idx_comment_attachments_monthly_service_comment
  ON comment_attachments(monthly_service_comment_id)
  WHERE monthly_service_comment_id IS NOT NULL;
