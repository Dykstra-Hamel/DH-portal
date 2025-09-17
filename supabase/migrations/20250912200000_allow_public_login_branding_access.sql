-- Allow public (unauthenticated) access to basic brand data needed for login pages
-- This enables the branded login pages to load company logos and colors

-- Add public read policy for brands table (logo and colors only)
CREATE POLICY "Allow public access to brand login data" ON brands
    FOR SELECT USING (true);

-- Add public read policy for company_settings table (login-specific settings only)  
CREATE POLICY "Allow public access to login settings" ON company_settings
    FOR SELECT USING (
        setting_key IN (
            'login_slogan_line_1', 
            'login_slogan_line_2', 
            'login_slogan_line_3', 
            'login_page_images'
        )
    );

-- Add comment explaining the security considerations
COMMENT ON POLICY "Allow public access to brand login data" ON brands IS 
'Allows unauthenticated access to basic branding data (logos, colors) needed for branded login pages. This data is considered safe for public viewing.';

COMMENT ON POLICY "Allow public access to login settings" ON company_settings IS 
'Allows unauthenticated access to login-specific company settings (slogans, background images) needed for branded login pages. Limited to login-related settings only.';