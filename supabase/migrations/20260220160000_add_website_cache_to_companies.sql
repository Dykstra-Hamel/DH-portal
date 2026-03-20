ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS website_content_cache TEXT,
  ADD COLUMN IF NOT EXISTS website_cached_at TIMESTAMPTZ;
