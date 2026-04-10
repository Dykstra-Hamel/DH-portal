-- Create storage bucket for field map pest stamp photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'field-map-photos',
  'field-map-photos',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their company's folder
CREATE POLICY "Authenticated users can upload field map photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'field-map-photos');

-- Allow authenticated users to read field map photos
CREATE POLICY "Authenticated users can read field map photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'field-map-photos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete field map photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'field-map-photos');
