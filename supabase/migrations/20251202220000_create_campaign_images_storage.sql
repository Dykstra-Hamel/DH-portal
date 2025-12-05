/**
 * Create Storage Bucket for Campaign Landing Page Images
 *
 * Bucket: campaign-landing-pages
 * - Public read access (images are displayed on public landing pages)
 * - Authenticated write access (only authenticated users can upload)
 * - Max file size: 5MB
 * - Allowed file types: jpg, jpeg, png, webp
 */

-- Create storage bucket for campaign landing page images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-landing-pages',
  'campaign-landing-pages',
  true, -- Public read access
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-landing-pages');

-- Policy: Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update campaign images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-landing-pages');

-- Policy: Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete campaign images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'campaign-landing-pages');

-- Policy: Allow public read access to campaign images
CREATE POLICY "Public can view campaign images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'campaign-landing-pages');
