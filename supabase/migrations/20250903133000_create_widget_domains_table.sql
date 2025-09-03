-- Migration: Create widget_domains table for company-specific domain management
-- This replaces the simple array in system_settings with proper relational structure

-- Step 1: Create widget_domains table
CREATE TABLE widget_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain VARCHAR(255) UNIQUE NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Step 2: Add indexes for performance
CREATE INDEX idx_widget_domains_company_id ON widget_domains(company_id);
CREATE INDEX idx_widget_domains_domain ON widget_domains(domain);
CREATE INDEX idx_widget_domains_active ON widget_domains(is_active);

-- Step 3: Add RLS policies
ALTER TABLE widget_domains ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can manage all domains
CREATE POLICY "Admins can manage all widget domains" ON widget_domains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Company users can view their own company's domains
CREATE POLICY "Company users can view their widget domains" ON widget_domains
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_companies 
      WHERE user_companies.user_id = auth.uid() 
      AND user_companies.company_id = widget_domains.company_id
    )
  );

-- Step 4: Add updated_at trigger
CREATE OR REPLACE FUNCTION update_widget_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_widget_domains_updated_at
  BEFORE UPDATE ON widget_domains
  FOR EACH ROW EXECUTE FUNCTION update_widget_domains_updated_at();

-- Step 5: Add comment explaining the table purpose
COMMENT ON TABLE widget_domains IS 'Stores widget-allowed domains tied to specific companies. Replaces the global array approach with proper relational structure.';
COMMENT ON COLUMN widget_domains.domain IS 'Full domain URL (e.g., https://example.com) that can embed widgets for the associated company';
COMMENT ON COLUMN widget_domains.company_id IS 'The company this domain is associated with';
COMMENT ON COLUMN widget_domains.is_active IS 'Whether this domain is currently active/allowed';

-- Migration complete - widget_domains table ready for use