-- Migration: Migrate existing domains to new widget_domains table
-- This migration handles data from both system_settings and companies.website

-- Step 1: Create a temporary function to safely migrate domains
CREATE OR REPLACE FUNCTION migrate_domains_to_widget_domains()
RETURNS TEXT AS $$
DECLARE
  company_rec RECORD;
  domain_text TEXT;
  domain_url TEXT;
  domains_migrated INTEGER := 0;
  system_domains JSONB;
  first_company_id UUID;
BEGIN
  -- First, get existing domains from system_settings
  SELECT value INTO system_domains
  FROM system_settings 
  WHERE key = 'widget_allowed_domains';
  
  -- Get the first company ID as a fallback for system domains
  SELECT id INTO first_company_id
  FROM companies 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  -- Migrate system-wide domains to the first company (admin can reassign later)
  IF system_domains IS NOT NULL AND jsonb_array_length(system_domains) > 0 THEN
    FOR i IN 0..jsonb_array_length(system_domains) - 1 LOOP
      domain_text := system_domains->>i;
      
      -- Skip empty domains
      IF domain_text IS NULL OR trim(domain_text) = '' THEN
        CONTINUE;
      END IF;
      
      -- Clean up the domain text
      domain_url := trim(domain_text);
      
      -- Insert into widget_domains if not exists and we have a company
      IF first_company_id IS NOT NULL THEN
        INSERT INTO widget_domains (domain, company_id, created_at, is_active)
        VALUES (domain_url, first_company_id, NOW(), true)
        ON CONFLICT (domain) DO NOTHING;
        
        domains_migrated := domains_migrated + 1;
      END IF;
    END LOOP;
  END IF;
  
  -- Migrate company website domains
  FOR company_rec IN 
    SELECT id, website 
    FROM companies 
    WHERE website IS NOT NULL 
    AND jsonb_typeof(website) = 'array'
    AND jsonb_array_length(website) > 0
  LOOP
    -- Process each domain in the company's website array
    FOR i IN 0..jsonb_array_length(company_rec.website) - 1 LOOP
      domain_text := company_rec.website->>i;
      
      -- Skip empty domains
      IF domain_text IS NULL OR trim(domain_text) = '' THEN
        CONTINUE;
      END IF;
      
      -- Clean up the domain text
      domain_url := trim(domain_text);
      
      -- Insert into widget_domains if not exists
      INSERT INTO widget_domains (domain, company_id, created_at, is_active)
      VALUES (domain_url, company_rec.id, NOW(), true)
      ON CONFLICT (domain) DO UPDATE SET
        -- If domain already exists, keep the existing one but log it
        updated_at = NOW();
      
      domains_migrated := domains_migrated + 1;
    END LOOP;
  END LOOP;
  
  RETURN 'Migration completed. Processed ' || domains_migrated || ' domains.';
END;
$$ LANGUAGE plpgsql;

-- Step 2: Run the migration
SELECT migrate_domains_to_widget_domains();

-- Step 3: Clean up the migration function
DROP FUNCTION migrate_domains_to_widget_domains();

-- Step 4: Add a note about what was migrated
INSERT INTO system_settings (key, value, description)
VALUES (
  'widget_domains_migrated',
  jsonb_build_object('migrated_at', NOW()::TEXT, 'migrated', true),
  'Records when widget domains were migrated from old system to new widget_domains table'
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Migration complete - existing domains have been migrated to widget_domains table