-- Create announcements table for company-wide announcements
-- These are displayed on the tickets dashboard

CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority = shown first
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_announcements_company_id ON announcements(company_id);
CREATE INDEX idx_announcements_active ON announcements(is_active, expires_at);
CREATE INDEX idx_announcements_published_at ON announcements(published_at DESC);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view announcements for companies they belong to
CREATE POLICY "Users can view announcements for their company"
  ON announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.company_id = announcements.company_id
    )
    OR
    -- Global admins can view all
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- RLS policy: Company admins can insert announcements
CREATE POLICY "Company admins can insert announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.company_id = announcements.company_id
      AND uc.role IN ('admin', 'manager', 'owner')
    )
    OR
    -- Global admins can insert for any company
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- RLS policy: Company admins can update announcements
CREATE POLICY "Company admins can update announcements"
  ON announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.company_id = announcements.company_id
      AND uc.role IN ('admin', 'manager', 'owner')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.company_id = announcements.company_id
      AND uc.role IN ('admin', 'manager', 'owner')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- RLS policy: Company admins can delete announcements
CREATE POLICY "Company admins can delete announcements"
  ON announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.company_id = announcements.company_id
      AND uc.role IN ('admin', 'manager', 'owner')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE announcements IS 'Company announcements displayed on the tickets dashboard';
