-- Create agents table for managing multiple Retell agents per company
CREATE TABLE agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agent_name varchar(255) NOT NULL,
  agent_id varchar(255) NOT NULL,
  phone_number varchar(50),
  agent_direction varchar(20) NOT NULL CHECK (agent_direction IN ('inbound', 'outbound')),
  agent_type varchar(20) NOT NULL CHECK (agent_type IN ('calling', 'sms', 'web_agent')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_agents_company_id ON agents(company_id);
CREATE INDEX idx_agents_agent_id ON agents(agent_id);
CREATE UNIQUE INDEX idx_agents_unique_agent_id ON agents(agent_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_agents_updated_at();

-- Add RLS policies for agents table
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see agents for companies they have access to
CREATE POLICY "Users can view agents for their companies" ON agents
  FOR SELECT
  USING (
    company_id IN (
      SELECT uc.company_id 
      FROM user_companies uc 
      WHERE uc.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policy: Users can insert agents for companies they have access to
CREATE POLICY "Users can insert agents for their companies" ON agents
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT uc.company_id 
      FROM user_companies uc 
      WHERE uc.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policy: Users can update agents for companies they have access to
CREATE POLICY "Users can update agents for their companies" ON agents
  FOR UPDATE
  USING (
    company_id IN (
      SELECT uc.company_id 
      FROM user_companies uc 
      WHERE uc.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policy: Users can delete agents for companies they have access to
CREATE POLICY "Users can delete agents for their companies" ON agents
  FOR DELETE
  USING (
    company_id IN (
      SELECT uc.company_id 
      FROM user_companies uc 
      WHERE uc.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Migrate existing agent data from company_settings
INSERT INTO agents (company_id, agent_name, agent_id, agent_direction, agent_type)
SELECT 
  cs.company_id,
  'Main Inbound Agent' as agent_name,
  cs.setting_value as agent_id,
  'inbound' as agent_direction,
  'calling' as agent_type
FROM company_settings cs
WHERE cs.setting_key = 'retell_inbound_agent_id' 
  AND cs.setting_value IS NOT NULL 
  AND cs.setting_value != ''
  AND cs.setting_value != 'undefined';

INSERT INTO agents (company_id, agent_name, agent_id, agent_direction, agent_type)
SELECT 
  cs.company_id,
  'Main Outbound Agent' as agent_name,
  cs.setting_value as agent_id,
  'outbound' as agent_direction,
  'calling' as agent_type
FROM company_settings cs
WHERE cs.setting_key = 'retell_outbound_agent_id' 
  AND cs.setting_value IS NOT NULL 
  AND cs.setting_value != ''
  AND cs.setting_value != 'undefined'
  AND NOT EXISTS (
    SELECT 1 FROM agents a 
    WHERE a.agent_id = cs.setting_value
  ); -- Avoid duplicates if inbound and outbound are the same

INSERT INTO agents (company_id, agent_name, agent_id, agent_direction, agent_type)
SELECT 
  cs.company_id,
  'Main Inbound SMS Agent' as agent_name,
  cs.setting_value as agent_id,
  'inbound' as agent_direction,
  'sms' as agent_type
FROM company_settings cs
WHERE cs.setting_key = 'retell_inbound_sms_agent_id' 
  AND cs.setting_value IS NOT NULL 
  AND cs.setting_value != ''
  AND cs.setting_value != 'undefined'
  AND NOT EXISTS (
    SELECT 1 FROM agents a 
    WHERE a.agent_id = cs.setting_value
  ); -- Avoid duplicates

INSERT INTO agents (company_id, agent_name, agent_id, agent_direction, agent_type)
SELECT 
  cs.company_id,
  'Main Outbound SMS Agent' as agent_name,
  cs.setting_value as agent_id,
  'outbound' as agent_direction,
  'sms' as agent_type
FROM company_settings cs
WHERE cs.setting_key = 'retell_outbound_sms_agent_id' 
  AND cs.setting_value IS NOT NULL 
  AND cs.setting_value != ''
  AND cs.setting_value != 'undefined'
  AND NOT EXISTS (
    SELECT 1 FROM agents a 
    WHERE a.agent_id = cs.setting_value
  ); -- Avoid duplicates

-- Try to set phone numbers for agents based on company settings
UPDATE agents 
SET phone_number = (
  SELECT cs.setting_value 
  FROM company_settings cs 
  WHERE cs.company_id = agents.company_id 
    AND cs.setting_key = 'retell_phone_number'
    AND cs.setting_value IS NOT NULL
    AND cs.setting_value != ''
)
WHERE agent_type = 'calling' AND phone_number IS NULL;

UPDATE agents 
SET phone_number = (
  SELECT COALESCE(
    (SELECT setting_value FROM company_settings WHERE company_id = agents.company_id AND setting_key = 'retell_sms_phone_number'),
    (SELECT setting_value FROM company_settings WHERE company_id = agents.company_id AND setting_key = 'retell_phone_number')
  )
)
WHERE agent_type = 'sms' AND phone_number IS NULL;

-- Remove old agent ID settings from company_settings (cleanup)
DELETE FROM company_settings 
WHERE setting_key IN (
  'retell_inbound_agent_id',
  'retell_outbound_agent_id', 
  'retell_inbound_sms_agent_id',
  'retell_outbound_sms_agent_id'
);