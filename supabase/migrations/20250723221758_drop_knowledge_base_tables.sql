-- Drop knowledge base items table and related objects
DROP TABLE IF EXISTS knowledge_base_items;

-- Drop the storage bucket for knowledge base files
DELETE FROM storage.buckets WHERE id = 'knowledge-base-files';

-- Remove knowledge base related settings (keep retell settings)
DELETE FROM company_settings WHERE setting_key IN (
  'knowledge_base_enabled',
  'knowledge_base_auto_refresh'
);