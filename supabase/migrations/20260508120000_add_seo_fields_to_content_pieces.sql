-- Add SEO page title and meta description fields to content pieces, plus
-- JSONB columns to persist AI-generated suggestion sets (mirroring the
-- existing ai_topics / ai_headlines / ai_draft pattern).
ALTER TABLE monthly_service_content_pieces
  ADD COLUMN IF NOT EXISTS page_title           TEXT,
  ADD COLUMN IF NOT EXISTS meta_description     TEXT,
  ADD COLUMN IF NOT EXISTS ai_page_titles       JSONB,
  ADD COLUMN IF NOT EXISTS ai_meta_descriptions JSONB;

COMMENT ON COLUMN monthly_service_content_pieces.page_title       IS 'SEO <title> tag for the published page (50–60 chars target)';
COMMENT ON COLUMN monthly_service_content_pieces.meta_description IS 'SEO meta description tag for the published page (150–160 chars target)';
