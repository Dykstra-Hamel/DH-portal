-- Set category_type on existing project_category_assignments based on project scope
-- This ensures the validation trigger works correctly

-- For internal projects (scope = 'internal'), set category_type to 'internal'
UPDATE project_category_assignments pca
SET category_type = 'internal'
FROM projects p
WHERE pca.project_id = p.id
  AND p.scope = 'internal'
  AND (pca.category_type IS NULL OR pca.category_type != 'internal');

-- For external projects (scope = 'external'), set category_type to 'external'
UPDATE project_category_assignments pca
SET category_type = 'external'
FROM projects p
WHERE pca.project_id = p.id
  AND p.scope = 'external'
  AND (pca.category_type IS NULL OR pca.category_type != 'external');

-- For 'both' projects, keep as 'internal' by default (can have both types)
-- Admin users will see internal categorization, company users will see external
UPDATE project_category_assignments pca
SET category_type = 'internal'
FROM projects p
WHERE pca.project_id = p.id
  AND p.scope = 'both'
  AND pca.category_type IS NULL;

-- Also update any existing task category assignments
UPDATE project_task_category_assignments ptca
SET category_type = 'internal'
FROM project_tasks pt
JOIN projects p ON pt.project_id = p.id
WHERE ptca.task_id = pt.id
  AND p.scope = 'internal'
  AND (ptca.category_type IS NULL OR ptca.category_type != 'internal');

UPDATE project_task_category_assignments ptca
SET category_type = 'external'
FROM project_tasks pt
JOIN projects p ON pt.project_id = p.id
WHERE ptca.task_id = pt.id
  AND p.scope = 'external'
  AND (ptca.category_type IS NULL OR ptca.category_type != 'external');

UPDATE project_task_category_assignments ptca
SET category_type = 'internal'
FROM project_tasks pt
JOIN projects p ON pt.project_id = p.id
WHERE ptca.task_id = pt.id
  AND p.scope = 'both'
  AND ptca.category_type IS NULL;
