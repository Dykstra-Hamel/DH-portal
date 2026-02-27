-- Add format column to leads, tickets, and support_cases
-- Also add source column to support_cases

-- leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS format VARCHAR(20)
  CHECK (format IN ('call','form','email','text'));

-- tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS format VARCHAR(20)
  CHECK (format IN ('call','form','email','text'));

-- support_cases
ALTER TABLE support_cases ADD COLUMN IF NOT EXISTS format VARCHAR(20)
  CHECK (format IN ('call','form','email','text'));
ALTER TABLE support_cases ADD COLUMN IF NOT EXISTS source VARCHAR(50);
