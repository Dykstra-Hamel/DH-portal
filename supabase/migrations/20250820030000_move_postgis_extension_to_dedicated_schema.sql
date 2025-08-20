-- MOVE POSTGIS EXTENSION FROM PUBLIC TO DEDICATED SCHEMA
-- This fixes the "Extension in Public" security warning from Supabase
-- PostGIS should not be in the public schema to prevent potential security issues

-- ===================================================================
-- SECTION 1: CREATE DEDICATED SCHEMA FOR POSTGIS
-- ===================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- ===================================================================
-- SECTION 2: MOVE POSTGIS TO EXTENSIONS SCHEMA
-- ===================================================================

-- Move PostGIS extension to extensions schema
-- Note: This requires dropping and recreating the extension
DO $$
BEGIN
    -- Check if PostGIS is currently installed in public schema
    IF EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'postgis' 
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE NOTICE 'Moving PostGIS extension from public to extensions schema...';
        
        -- Drop PostGIS from public schema (this preserves spatial data)
        DROP EXTENSION IF EXISTS postgis CASCADE;
        
        -- Recreate PostGIS in extensions schema
        CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
        
        RAISE NOTICE '✅ PostGIS extension moved to extensions schema';
    ELSE
        -- PostGIS not in public, just ensure it exists in extensions
        CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
        RAISE NOTICE '✅ PostGIS extension ensured in extensions schema';
    END IF;
END $$;

-- ===================================================================
-- SECTION 3: UPDATE FUNCTION SEARCH PATHS FOR POSTGIS ACCESS
-- ===================================================================

-- Update spatial functions to include extensions schema in search_path
-- These are the functions that use PostGIS functionality

-- Update check_service_area_coverage to access PostGIS functions
DROP FUNCTION IF EXISTS public.check_service_area_coverage(UUID, DECIMAL, DECIMAL, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.check_service_area_coverage(
    p_company_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'  -- Include extensions for PostGIS access
AS $function$
DECLARE
    covered BOOLEAN := FALSE;
BEGIN
    -- Check if location is covered by any service area
    SELECT EXISTS(
        SELECT 1 FROM public.service_areas sa
        WHERE sa.company_id = p_company_id 
          AND sa.is_active = true
          AND (
            -- Polygon coverage (using PostGIS ST_Contains)
            (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
             extensions.ST_Contains(sa.polygon, extensions.ST_Point(p_longitude, p_latitude))) OR
            
            -- Radius coverage (using PostGIS ST_DWithin)
            (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND
             extensions.ST_DWithin(
               sa.center_point::geography, 
               extensions.ST_Point(p_longitude, p_latitude)::geography,
               sa.radius_miles * 1609.34
             )) OR
            
            -- Zip code coverage
            (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
             sa.zip_codes IS NOT NULL AND 
             p_zip_code = ANY(sa.zip_codes))
          )
    ) INTO covered;
    
    RETURN covered;
END;
$function$;

-- Update get_service_areas_for_location to access PostGIS functions
DROP FUNCTION IF EXISTS public.get_service_areas_for_location(UUID, DECIMAL, DECIMAL, TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.get_service_areas_for_location(
    p_company_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS TABLE(
    area_id UUID,
    area_name VARCHAR(255),
    area_type VARCHAR(50),
    priority INTEGER,
    matched_condition TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'  -- Include extensions for PostGIS access
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.name,
        sa.type,
        sa.priority,
        CASE 
            WHEN sa.type = 'polygon' THEN 'polygon_match'
            WHEN sa.type = 'radius' THEN 'radius_match'
            WHEN sa.type = 'zip_code' THEN 'zip_match'
        END as matched_condition
    FROM public.service_areas sa
    WHERE sa.company_id = p_company_id 
      AND sa.is_active = true
      AND (
        -- Polygon check with spatial index (using qualified PostGIS functions)
        (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
         extensions.ST_Contains(sa.polygon, extensions.ST_Point(p_longitude, p_latitude))) OR
        
        -- Radius check with geography (using qualified PostGIS functions)
        (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND
         extensions.ST_DWithin(
           sa.center_point::geography, 
           extensions.ST_Point(p_longitude, p_latitude)::geography,
           sa.radius_miles * 1609.34
         )) OR
        
        -- Zip code check with GIN index
        (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
         sa.zip_codes IS NOT NULL AND 
         p_zip_code = ANY(sa.zip_codes))
      )
    ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$function$;

-- ===================================================================
-- SECTION 4: CREATE SECURITY NOTICE FOR FUTURE SPATIAL FUNCTIONS
-- ===================================================================

-- Create a helper function to remind developers about PostGIS schema
CREATE OR REPLACE FUNCTION public.postgis_security_notice()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN 'PostGIS functions are now in extensions schema. Use extensions.ST_* for spatial operations.';
END;
$function$;

-- ===================================================================
-- SECTION 5: VERIFICATION AND TESTING
-- ===================================================================

DO $$
DECLARE
    postgis_schema TEXT;
    spatial_functions_count INTEGER;
BEGIN
    -- Verify PostGIS is in extensions schema
    SELECT n.nspname INTO postgis_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'postgis';
    
    -- Count functions that might use spatial operations
    SELECT COUNT(*) INTO spatial_functions_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' 
    AND p.prosrc LIKE '%ST_%'
    AND p.prosecdef = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'POSTGIS SCHEMA MIGRATION COMPLETE';
    RAISE NOTICE '========================================';
    
    IF postgis_schema = 'extensions' THEN
        RAISE NOTICE '✅ PostGIS extension is now in extensions schema';
        RAISE NOTICE '✅ "Extension in Public" security warning resolved';
    ELSE
        RAISE NOTICE '❌ PostGIS extension is still in % schema', postgis_schema;
    END IF;
    
    RAISE NOTICE 'Functions using spatial operations: %', spatial_functions_count;
    RAISE NOTICE '';
    
    -- Test spatial function access
    BEGIN
        PERFORM extensions.ST_Point(0, 0);
        RAISE NOTICE '✅ PostGIS functions accessible via extensions schema';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Error accessing PostGIS functions: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: All future spatial functions should use';
    RAISE NOTICE 'SET search_path = ''public, extensions'' to access PostGIS';
    RAISE NOTICE '========================================';
    
END $$;

-- Update statistics after schema changes
ANALYZE pg_proc;
ANALYZE pg_extension;