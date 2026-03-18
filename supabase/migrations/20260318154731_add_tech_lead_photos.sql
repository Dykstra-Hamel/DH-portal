-- Storage bucket for tech lead field photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tech-lead-photos',
  'tech-lead-photos',
  true,
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload tech lead photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tech-lead-photos'
    AND auth.role() = 'authenticated'
  );

-- Public read access (URLs contain companyId/userId/timestamp for obscurity)
CREATE POLICY "Public can view tech lead photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tech-lead-photos');

-- Authenticated users can delete uploads
CREATE POLICY "Authenticated users can delete tech lead photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tech-lead-photos'
    AND auth.role() = 'authenticated'
  );

-- Add photo_urls column to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';
