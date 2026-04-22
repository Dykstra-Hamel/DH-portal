-- Make company_id nullable so NULL = global rule
ALTER TABLE ai_standing_instructions ALTER COLUMN company_id DROP NOT NULL;

-- Add index for efficient global rule lookups
CREATE INDEX idx_ai_standing_instructions_global
  ON ai_standing_instructions(scope, content_type)
  WHERE company_id IS NULL AND is_active = true;
