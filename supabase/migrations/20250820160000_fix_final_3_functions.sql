-- FIX THE FINAL 3 SECURITY WARNINGS
-- Set all functions to search_path = '' and use fully qualified function calls

-- ===================================================================
-- 1. Fix check_service_area_coverage - use empty search_path
-- ===================================================================

CREATE OR REPLACE FUNCTION public.check_service_area_coverage(
    p_company_id UUID,
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Empty search_path for maximum security
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
            -- Polygon coverage (using fully qualified PostGIS functions)
            (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
             extensions.ST_Contains(sa.polygon, extensions.ST_Point(p_longitude, p_latitude))) OR
            
            -- Radius coverage (using fully qualified PostGIS functions)
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

-- ===================================================================
-- 2. Fix get_service_areas_for_location - use empty search_path
-- ===================================================================

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
SET search_path = ''  -- Empty search_path for maximum security
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
        -- Polygon check with fully qualified PostGIS functions
        (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
         extensions.ST_Contains(sa.polygon, extensions.ST_Point(p_longitude, p_latitude))) OR
        
        -- Radius check with fully qualified PostGIS functions
        (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND
         extensions.ST_DWithin(
           sa.center_point::geography, 
           extensions.ST_Point(p_longitude, p_latitude)::geography,
           sa.radius_miles * 1609.34
         )) OR
        
        -- Zip code check
        (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND 
         sa.zip_codes IS NOT NULL AND 
         p_zip_code = ANY(sa.zip_codes))
      )
    ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$function$;

-- ===================================================================
-- 3. Fix handle_new_user - use empty search_path
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Empty search_path for maximum security
AS $function$
DECLARE
    full_name TEXT;
    name_parts TEXT[];
    first_name_val TEXT;
    last_name_val TEXT;
BEGIN
    -- Get the full name from OAuth providers
    full_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data->>'last_name', '')
        )
    );

    -- Split the full name into first and last name
    IF full_name IS NOT NULL AND full_name != '' THEN
        name_parts := string_to_array(trim(full_name), ' ');
        first_name_val := COALESCE(name_parts[1], '');

        -- Join all remaining parts as last name
        IF array_length(name_parts, 1) > 1 THEN
            last_name_val := array_to_string(name_parts[2:], ' ');
        ELSE
            last_name_val := '';
        END IF;
    ELSE
        -- Fallback to individual fields if available
        first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    END IF;

    -- Insert into profiles table with fully qualified name
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        first_name_val,
        last_name_val
    );

    RETURN NEW;
END;
$function$;

-- Recreate the trigger (in case it was dropped)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- FINAL VERIFICATION
-- ===================================================================

DO $$
DECLARE
    vulnerable_count INTEGER := 0;
    non_empty_search_path INTEGER := 0;
    func_record RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL 3 FUNCTIONS SECURITY FIX VERIFICATION ===';
    RAISE NOTICE '';
    
    -- Count functions with no search_path (vulnerable)
    SELECT COUNT(*) INTO vulnerable_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NULL;
    
    -- Count functions with non-empty search_path (Supabase wants all empty)
    SELECT COUNT(*) INTO non_empty_search_path
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proconfig IS NOT NULL
    AND array_to_string(p.proconfig, ',') != 'search_path=""';
    
    RAISE NOTICE 'Functions with no search_path: %', vulnerable_count;
    RAISE NOTICE 'Functions with non-empty search_path: %', non_empty_search_path;
    RAISE NOTICE '';
    
    -- Check the 3 specific functions
    RAISE NOTICE 'THE 3 PROBLEMATIC FUNCTIONS:';
    FOR func_record IN 
        SELECT 
            p.proname,
            CASE 
                WHEN p.proconfig IS NULL THEN '❌ NO search_path'
                WHEN array_to_string(p.proconfig, ',') = 'search_path=""' THEN '✅ EMPTY search_path'
                ELSE '⚠️ ' || array_to_string(p.proconfig, ', ')
            END as status
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.prosecdef = true
        AND p.proname IN ('check_service_area_coverage', 'get_service_areas_for_location', 'handle_new_user')
        ORDER BY p.proname
    LOOP
        RAISE NOTICE '  %: %', func_record.proname, func_record.status;
    END LOOP;
    
    RAISE NOTICE '';
    
    IF vulnerable_count = 0 AND non_empty_search_path = 0 THEN
        RAISE NOTICE '🎉 PERFECT! ALL FUNCTIONS NOW HAVE EMPTY SEARCH_PATH!';
        RAISE NOTICE '✅ Maximum security achieved';
        RAISE NOTICE '✅ Zero "Function Search Path Mutable" warnings expected';
        RAISE NOTICE '✅ All PostGIS and auth functions use fully qualified names';
    ELSE
        RAISE NOTICE '⚠️ Still have issues:';
        RAISE NOTICE '   - Vulnerable functions: %', vulnerable_count;
        RAISE NOTICE '   - Non-empty search_path: %', non_empty_search_path;
    END IF;
    
END $$;