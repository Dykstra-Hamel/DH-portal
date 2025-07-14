-- Create storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'brand-assets',
    'brand-assets',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Create storage policies for brand assets
-- Only admins can upload brand assets
CREATE POLICY "Allow admin users to upload brand assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'brand-assets' AND
        auth.role() = 'authenticated' AND
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- All authenticated users can view brand assets
CREATE POLICY "Allow authenticated users to view brand assets" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'brand-assets' AND
        auth.role() = 'authenticated'
    );

-- Only admins can update brand assets
CREATE POLICY "Allow admin users to update brand assets" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'brand-assets' AND
        auth.role() = 'authenticated' AND
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Only admins can delete brand assets
CREATE POLICY "Allow admin users to delete brand assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'brand-assets' AND
        auth.role() = 'authenticated' AND
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Enable public access to brand assets (for viewing)
CREATE POLICY "Allow public access to brand assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'brand-assets');