-- Add SVG support to brand-assets bucket
-- Allow image/svg+xml MIME type for logo uploads

UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
WHERE id = 'brand-assets';