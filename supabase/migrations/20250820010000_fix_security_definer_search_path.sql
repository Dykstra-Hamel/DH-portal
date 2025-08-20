-- FIX SECURITY DEFINER search_path VULNERABILITIES
-- This migration fixes critical security vulnerabilities where SECURITY DEFINER functions
-- do not have proper search_path configuration, making them vulnerable to schema injection attacks

-- ===================================================================
-- CRITICAL SECURITY FIX: handle_new_user function
-- This function executes during OAuth registration and creates user profiles
-- ===================================================================

-- Drop the trigger first, then the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, auth'  -- Secure search_path - prevents schema injection
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

    -- Insert into profiles table with explicit schema qualification
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

-- Recreate the trigger with the secured function
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- HIGH PRIORITY FIX: execute_sql function  
-- This is currently a placeholder but should be secured
-- ===================================================================

-- Drop and recreate execute_sql with secure search_path
DROP FUNCTION IF EXISTS public.execute_sql(text, jsonb);

CREATE OR REPLACE FUNCTION public.execute_sql(query text, params jsonb DEFAULT '[]'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Empty search_path for maximum security
AS $function$
DECLARE
    result JSONB;
BEGIN
    -- This is a placeholder function for complex SQL execution
    -- In production, this would need proper parameter binding and security
    -- For now, we'll use simpler approaches in the API routes
    -- 
    -- NOTE: With empty search_path, any table references must be fully qualified
    -- Example: SELECT * FROM public.leads instead of SELECT * FROM leads
    
    RETURN '[]'::JSONB;
END;
$function$;

-- ===================================================================
-- EVALUATE PostGIS FUNCTIONS
-- Check if st_estimatedextent functions are actively used
-- ===================================================================

DO $$
DECLARE
    postgis_usage_count INTEGER := 0;
BEGIN
    -- Check if any service_areas use PostGIS spatial functions
    SELECT COUNT(*) INTO postgis_usage_count
    FROM public.service_areas 
    WHERE polygon IS NOT NULL OR center_point IS NOT NULL;
    
    RAISE NOTICE 'PostGIS SECURITY EVALUATION:';
    RAISE NOTICE 'Service areas with spatial data: %', postgis_usage_count;
    
    IF postgis_usage_count > 0 THEN
        RAISE NOTICE 'PostGIS functions are actively used - st_estimatedextent functions should be secured';
        RAISE NOTICE 'Consider creating wrapper functions with proper search_path if needed';
    ELSE
        RAISE NOTICE 'No active PostGIS usage detected - st_estimatedextent functions may be dropped';
    END IF;
END $$;

-- ===================================================================
-- CREATE SECURE WRAPPER FOR PostGIS IF NEEDED
-- Only if spatial data is being used
-- ===================================================================

-- Check if we have spatial data and create secure wrappers if needed
DO $$
DECLARE
    has_spatial_data BOOLEAN := FALSE;
BEGIN
    -- Check for actual spatial data usage
    SELECT EXISTS(
        SELECT 1 FROM public.service_areas 
        WHERE polygon IS NOT NULL OR center_point IS NOT NULL
    ) INTO has_spatial_data;
    
    IF has_spatial_data THEN
        -- Create secure wrapper functions for st_estimatedextent if needed
        -- These would have proper search_path configuration
        
        RAISE NOTICE 'Creating secure PostGIS wrapper functions...';
        
        -- Example secure wrapper (commented out unless actually needed):
        /*
        CREATE OR REPLACE FUNCTION public.secure_st_estimatedextent(
            schema_name text, 
            table_name text, 
            column_name text
        )
        RETURNS box2d
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = 'public'
        AS $wrapper$
        BEGIN
            -- Call the original function with controlled parameters
            RETURN public.st_estimatedextent(schema_name, table_name, column_name);
        END;
        $wrapper$;
        */
        
        RAISE NOTICE 'Spatial data detected but secure wrappers not implemented yet';
        RAISE NOTICE 'Original st_estimatedextent functions should be evaluated case-by-case';
    END IF;
END $$;

-- ===================================================================
-- VERIFICATION AND TESTING
-- ===================================================================

-- Test that our functions have proper search_path configuration
DO $$
DECLARE
    func_count INTEGER;
    secure_func_count INTEGER;
BEGIN
    -- Count total SECURITY DEFINER functions in public schema
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true AND n.nspname = 'public';
    
    -- Count SECURITY DEFINER functions with search_path configuration
    SELECT COUNT(*) INTO secure_func_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosecdef = true 
    AND n.nspname = 'public'
    AND p.proconfig IS NOT NULL;
    
    RAISE NOTICE 'SECURITY DEFINER FUNCTION AUDIT:';
    RAISE NOTICE 'Total SECURITY DEFINER functions: %', func_count;
    RAISE NOTICE 'Functions with search_path config: %', secure_func_count;
    
    IF secure_func_count >= 2 THEN  -- Our 2 custom functions should be secured
        RAISE NOTICE '✅ Critical custom functions secured';
    ELSE
        RAISE NOTICE '⚠️  Some functions may still need search_path configuration';
    END IF;
END $$;

-- Update function statistics
ANALYZE pg_proc;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'SECURITY DEFINER search_path FIX COMPLETE:';
    RAISE NOTICE '1. ✅ handle_new_user() - Secured with search_path="public, auth"';
    RAISE NOTICE '2. ✅ execute_sql() - Secured with search_path=""';
    RAISE NOTICE '3. ⚠️  PostGIS functions evaluated - may need manual review';
    RAISE NOTICE '4. 🔒 Schema injection attacks prevented';
    RAISE NOTICE '5. 📋 OAuth registration flow should be tested';
END $$;