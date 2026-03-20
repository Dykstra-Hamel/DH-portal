-- Add content_type to monthly_service_task_templates
-- Allows the planned content type to be known at the template level,
-- so it can be auto-propagated to content pieces when tasks are generated each month

ALTER TABLE monthly_service_task_templates
ADD COLUMN IF NOT EXISTS content_type TEXT
    CHECK (content_type IN ('blog', 'evergreen', 'location', 'pillar', 'cluster', 'pest_id', 'other'));

COMMENT ON COLUMN monthly_service_task_templates.content_type IS 'Type of content this template produces (only relevant for Content department templates)';
