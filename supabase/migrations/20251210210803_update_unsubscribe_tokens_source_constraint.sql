-- Update unsubscribe_tokens source constraint to allow all email sources
-- The original constraint was too restrictive and blocked legitimate email sources
-- like 'automation_workflow', 'template_test', notification sources, etc.

-- Drop the old restrictive constraint
ALTER TABLE unsubscribe_tokens
DROP CONSTRAINT IF EXISTS unsubscribe_tokens_source_check;

-- Add a more flexible constraint that just ensures source is not empty
-- Individual source values are managed in the application code
ALTER TABLE unsubscribe_tokens
ADD CONSTRAINT unsubscribe_tokens_source_check
CHECK (source IS NOT NULL AND source <> '' AND LENGTH(source) <= 100);

-- Update comment to reflect the change
COMMENT ON COLUMN unsubscribe_tokens.source IS 'Source that generated this token (e.g., automation_workflow, email_campaign, template_test, notification sources, etc.)';
