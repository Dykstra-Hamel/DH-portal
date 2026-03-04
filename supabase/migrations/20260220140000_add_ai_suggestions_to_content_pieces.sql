ALTER TABLE monthly_service_content_pieces
  ADD COLUMN IF NOT EXISTS ai_topics    JSONB,
  ADD COLUMN IF NOT EXISTS ai_headlines JSONB,
  ADD COLUMN IF NOT EXISTS ai_draft     JSONB;
