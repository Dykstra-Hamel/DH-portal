-- Update Brand Assets RLS Policies
-- Allow company users to upload/manage images in their own company folders
-- Migration for consolidating image storage to brand-assets bucket

-- Drop old admin-only policies
DROP POLICY IF EXISTS "Allow admin users to upload brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to update brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin users to delete brand assets" ON storage.objects;

-- Create new company-based policies
-- Allow authenticated users to upload to their company folders
CREATE POLICY "Users can upload to their company folders in brand assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets' AND
  (
    -- Allow if user is admin (unrestricted)
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    OR
    -- Allow if path starts with user's company name (cleaned)
    EXISTS (
      SELECT 1
      FROM user_companies uc
      JOIN companies c ON c.id = uc.company_id
      WHERE uc.user_id = auth.uid()
      -- Clean company name: lowercase, remove special chars, replace spaces with hyphens
      AND LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(c.name, '[^a-z0-9\s-]', '', 'gi'),
            '\s+', '-', 'g'
          ),
          '-+', '-', 'g'
        )
      ) = SPLIT_PART(name, '/', 1)
    )
  )
);

-- Allow authenticated users to update images in their company folders
CREATE POLICY "Users can update their company images in brand assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets' AND
  (
    -- Allow if user is admin (unrestricted)
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    OR
    -- Allow if path starts with user's company name (cleaned)
    EXISTS (
      SELECT 1
      FROM user_companies uc
      JOIN companies c ON c.id = uc.company_id
      WHERE uc.user_id = auth.uid()
      AND LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(c.name, '[^a-z0-9\s-]', '', 'gi'),
            '\s+', '-', 'g'
          ),
          '-+', '-', 'g'
        )
      ) = SPLIT_PART(name, '/', 1)
    )
  )
);

-- Allow authenticated users to delete images from their company folders
CREATE POLICY "Users can delete their company images in brand assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets' AND
  (
    -- Allow if user is admin (unrestricted)
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    OR
    -- Allow if path starts with user's company name (cleaned)
    EXISTS (
      SELECT 1
      FROM user_companies uc
      JOIN companies c ON c.id = uc.company_id
      WHERE uc.user_id = auth.uid()
      AND LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(c.name, '[^a-z0-9\s-]', '', 'gi'),
            '\s+', '-', 'g'
          ),
          '-+', '-', 'g'
        )
      ) = SPLIT_PART(name, '/', 1)
    )
  )
);

-- Keep existing public read access policy (from line 44 of 20250714000001_create_brand_storage.sql)
-- "Allow public access to brand assets" - No changes needed

-- Keep existing authenticated read access policy (from line 21 of 20250714000001_create_brand_storage.sql)
-- "Allow authenticated users to view brand assets" - No changes needed
