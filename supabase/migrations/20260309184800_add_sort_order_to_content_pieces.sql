ALTER TABLE monthly_service_content_pieces
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;
