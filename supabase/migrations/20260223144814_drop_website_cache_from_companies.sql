ALTER TABLE companies
  DROP COLUMN IF EXISTS website_content_cache,
  DROP COLUMN IF EXISTS website_cached_at;
