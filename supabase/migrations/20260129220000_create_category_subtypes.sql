-- Create project_type_subtypes table to allow project types to have subtypes
-- Project types are: WEB, SOC, EML, PRT, VEH, DIG, ADS (hard-coded)
CREATE TABLE IF NOT EXISTS project_type_subtypes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_type VARCHAR(10) NOT NULL, -- WEB, SOC, EML, PRT, VEH, DIG, ADS
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_project_type_subtype_name UNIQUE(project_type, name),
  CONSTRAINT valid_project_type CHECK (project_type IN ('WEB', 'SOC', 'EML', 'PRT', 'VEH', 'DIG', 'ADS'))
);

-- Create index for faster lookups
CREATE INDEX idx_project_type_subtypes_type ON project_type_subtypes(project_type);
CREATE INDEX idx_project_type_subtypes_sort_order ON project_type_subtypes(sort_order);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_type_subtype_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_type_subtypes_updated_at
  BEFORE UPDATE ON project_type_subtypes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_type_subtype_updated_at();

-- Enable RLS
ALTER TABLE project_type_subtypes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_type_subtypes
-- Admins can do everything
CREATE POLICY "Admins have full access to project type subtypes"
  ON project_type_subtypes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
  );

-- All users can view project type subtypes (they're system-wide)
CREATE POLICY "Users can view project type subtypes"
  ON project_type_subtypes
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
