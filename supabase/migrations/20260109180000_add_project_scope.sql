-- Add scope field to projects table
ALTER TABLE projects
ADD COLUMN scope TEXT DEFAULT 'internal';

-- Add check constraint for valid values
ALTER TABLE projects
ADD CONSTRAINT projects_scope_check
CHECK (scope IN ('internal', 'external', 'both'));

-- Add index for faster filtering
CREATE INDEX idx_projects_scope ON projects(scope);

-- Add comment for documentation
COMMENT ON COLUMN projects.scope IS 'Defines project work responsibility: internal = agency-only work; external = client-side only work (hidden by "Hide External" toggle); both = requires work from both sides';

-- Update existing projects to have proper scope based on is_internal
-- Projects with is_internal=true stay as 'internal', others default to 'internal' as well
UPDATE projects
SET scope = CASE
  WHEN is_internal = true THEN 'internal'
  ELSE 'internal'
END;
