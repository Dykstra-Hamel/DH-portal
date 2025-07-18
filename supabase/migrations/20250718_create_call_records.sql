-- Create call_records table to store Retell.ai call data
CREATE TABLE call_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id VARCHAR(255) UNIQUE NOT NULL, -- Retell call ID
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  from_number VARCHAR(20),
  call_status VARCHAR(50), -- 'completed', 'failed', 'busy', etc.
  start_timestamp TIMESTAMPTZ,
  end_timestamp TIMESTAMPTZ,
  duration_seconds INTEGER,
  recording_url TEXT,
  transcript TEXT,
  call_analysis JSONB, -- Raw analysis from Retell
  
  -- Extracted structured data
  sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
  home_size VARCHAR(50), -- e.g., "2500 sq ft", "3 bedroom"
  yard_size VARCHAR(50), -- e.g., "0.5 acre", "small"
  budget_range VARCHAR(50), -- e.g., "$10,000-15,000"
  timeline VARCHAR(50), -- e.g., "spring 2024", "asap"
  pain_points TEXT[], -- array of pain points mentioned
  decision_maker VARCHAR(100), -- who makes decisions
  
  disconnect_reason VARCHAR(100),
  retell_variables JSONB, -- variables passed to/from Retell
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_call_records_lead_id ON call_records(lead_id);
CREATE INDEX idx_call_records_customer_id ON call_records(customer_id);
CREATE INDEX idx_call_records_phone_number ON call_records(phone_number);
CREATE INDEX idx_call_records_call_id ON call_records(call_id);
CREATE INDEX idx_call_records_created_at ON call_records(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_call_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_call_records_updated_at
  BEFORE UPDATE ON call_records
  FOR EACH ROW
  EXECUTE FUNCTION update_call_records_updated_at();

-- Enable RLS
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "call_records_admin_all" ON call_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "call_records_user_own_leads" ON call_records
  FOR SELECT USING (
    lead_id IN (
      SELECT leads.id FROM leads
      WHERE leads.assigned_to = auth.uid()
    )
  );