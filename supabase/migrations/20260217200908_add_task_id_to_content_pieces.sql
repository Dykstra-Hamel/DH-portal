-- Link content pieces to the project_task that produced them
-- Allows the task panel to read/write the associated content piece

ALTER TABLE monthly_service_content_pieces
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL;

-- One content piece per task
CREATE UNIQUE INDEX IF NOT EXISTS idx_ms_content_pieces_task_id
    ON monthly_service_content_pieces(task_id)
    WHERE task_id IS NOT NULL;

COMMENT ON COLUMN monthly_service_content_pieces.task_id IS 'The project_task responsible for producing this content piece (optional)';
