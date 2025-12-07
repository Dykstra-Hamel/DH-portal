-- Revert overly permissive public access policies for security
-- These policies exposed sensitive company and brand data publicly

-- Drop the policy that allowed anonymous access to all company data  
DROP POLICY IF EXISTS "Allow anonymous read access for login branding by slug" ON companies;

-- Drop the policy that exposed all brand data publicly
DROP POLICY IF EXISTS "Allow public access to brand login data" ON brands;

-- Drop the policy that allowed public access to company settings
DROP POLICY IF EXISTS "Allow public access to login settings" ON company_settings;

-- Add comment explaining the security change
COMMENT ON TABLE companies IS 'Company data access now requires authentication or service role. Anonymous access removed for security.';
COMMENT ON TABLE brands IS 'Brand data access now requires authentication or service role. Public access to sensitive brand information removed.';
COMMENT ON TABLE company_settings IS 'Company settings access now requires proper authentication. Public access to login settings removed - API uses service role instead.';