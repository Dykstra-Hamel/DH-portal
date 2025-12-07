-- Allow anonymous users to read basic company data by slug for branded login pages
CREATE POLICY "Allow anonymous read access for login branding by slug"
ON companies FOR SELECT
TO anon
USING (slug IS NOT NULL);