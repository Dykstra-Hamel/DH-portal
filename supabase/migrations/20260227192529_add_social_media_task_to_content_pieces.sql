ALTER TABLE monthly_service_content_pieces
  ADD COLUMN social_media_task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX monthly_service_content_pieces_social_media_task_id_unique
  ON monthly_service_content_pieces (social_media_task_id)
  WHERE social_media_task_id IS NOT NULL;
