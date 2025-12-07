-- Create enum for bulk upload status
CREATE TYPE bulk_upload_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Create bulk_lead_uploads table
CREATE TABLE IF NOT EXISTS bulk_lead_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status bulk_upload_status NOT NULL DEFAULT 'pending',
  file_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  parsed_data JSONB NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  successful_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_bulk_lead_uploads_company_id ON bulk_lead_uploads(company_id);
CREATE INDEX idx_bulk_lead_uploads_created_by ON bulk_lead_uploads(created_by);
CREATE INDEX idx_bulk_lead_uploads_status ON bulk_lead_uploads(status);
CREATE INDEX idx_bulk_lead_uploads_scheduled_at ON bulk_lead_uploads(scheduled_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE bulk_lead_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view bulk uploads from their company
CREATE POLICY "Users can view their company bulk uploads"
  ON bulk_lead_uploads
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can create bulk uploads for their company
CREATE POLICY "Users can create bulk uploads for their company"
  ON bulk_lead_uploads
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update bulk uploads they created
CREATE POLICY "Users can update their own bulk uploads"
  ON bulk_lead_uploads
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete (cancel) bulk uploads they created
CREATE POLICY "Users can delete their own bulk uploads"
  ON bulk_lead_uploads
  FOR DELETE
  USING (created_by = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_bulk_lead_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bulk_lead_uploads_updated_at
  BEFORE UPDATE ON bulk_lead_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_bulk_lead_uploads_updated_at();
