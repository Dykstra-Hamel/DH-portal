-- Fix project scope values based on is_internal flag
-- Projects with is_internal=false should be 'external', not 'internal'

UPDATE projects
SET scope = CASE
  WHEN is_internal = true THEN 'internal'
  WHEN is_internal = false THEN 'external'
  ELSE 'internal'
END
WHERE scope = 'internal';

-- Add comment explaining the fix
COMMENT ON COLUMN projects.scope IS 'Defines project work responsibility: internal = agency-only work (visible on admin page); external = client-side only work (visible on regular page); both = requires work from both sides (visible on both pages)';
