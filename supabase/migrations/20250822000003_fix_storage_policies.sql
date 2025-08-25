-- Fix storage policies for brand-assets bucket
-- This ensures authenticated users can upload files to the storage bucket

-- Create the brand-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;

-- Allow admin users to upload files for any company
CREATE POLICY "Admins can upload files" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND bucket_id = 'brand-assets'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow public read access for all files (since bucket is public)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'brand-assets');

-- Allow admin users to update any files
CREATE POLICY "Admins can update files" ON storage.objects
  FOR UPDATE 
  USING (
    auth.role() = 'authenticated' 
    AND bucket_id = 'brand-assets'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND bucket_id = 'brand-assets'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow admin users to delete any files
CREATE POLICY "Admins can delete files" ON storage.objects
  FOR DELETE 
  USING (
    auth.role() = 'authenticated' 
    AND bucket_id = 'brand-assets'
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS is already enabled on storage.objects by default in Supabase