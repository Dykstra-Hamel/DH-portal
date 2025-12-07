-- Add slug column to companies table
ALTER TABLE companies ADD COLUMN slug VARCHAR(255);

-- Create unique index on slug
CREATE UNIQUE INDEX idx_companies_slug ON companies(slug);

-- Function to generate URL-safe slug from company name
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Convert to lowercase, replace spaces and special chars with hyphens
    base_slug := LOWER(TRIM(company_name));
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    base_slug := TRIM(base_slug, '-');
    
    -- Ensure slug is not empty
    IF LENGTH(base_slug) = 0 THEN
        base_slug := 'company';
    END IF;
    
    -- Check if slug exists and add counter if needed
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM companies WHERE slug = final_slug) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Generate slugs for existing companies
UPDATE companies 
SET slug = generate_company_slug(name) 
WHERE slug IS NULL;

-- Make slug NOT NULL after populating existing records
ALTER TABLE companies ALTER COLUMN slug SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN companies.slug IS 'URL-safe unique identifier for company-specific login pages';