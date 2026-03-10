-- 1. Extend project_type_subtypes with custom attribute support
ALTER TABLE project_type_subtypes
  ADD COLUMN has_custom_attributes BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN custom_attribute_schema JSONB NOT NULL DEFAULT '[]';
-- schema shape: [{ id, label, type: 'text'|'number'|'select'|'textarea', options?: string[] }, ...]

-- 2. Extend projects with subtype FK and custom attribute values
ALTER TABLE projects
  ADD COLUMN project_subtype_id UUID REFERENCES project_type_subtypes(id) ON DELETE SET NULL,
  ADD COLUMN custom_attribute_values JSONB NOT NULL DEFAULT '{}';
-- values shape: { [attributeId]: value }

CREATE INDEX idx_projects_subtype_id ON projects(project_subtype_id);

-- 3. Backfill project_subtype_id (best-effort — matches on current DB names)
UPDATE projects p
SET project_subtype_id = pts.id
FROM project_type_subtypes pts
WHERE pts.name = p.project_subtype
  AND pts.project_type = CASE p.project_type
    WHEN 'print'     THEN 'PRT'
    WHEN 'digital'   THEN 'DIG'
    WHEN 'social'    THEN 'SOC'
    WHEN 'email'     THEN 'EML'
    WHEN 'website'   THEN 'WEB'
    WHEN 'vehicle'   THEN 'VEH'
    WHEN 'ads'       THEN 'ADS'
    WHEN 'campaigns' THEN 'CAM'
    WHEN 'software'  THEN 'SFT'
    ELSE NULL
  END;
