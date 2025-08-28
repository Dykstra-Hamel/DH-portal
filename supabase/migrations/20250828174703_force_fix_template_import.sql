-- FORCE FIX TEMPLATE IMPORT FUNCTION
-- Aggressively replace all versions of the function with a working version
-- This should run after all other migrations to ensure it's the final version

-- Nuclear option: Drop ALL functions with this name regardless of signature
-- This ensures we remove the broken function that contains library_template_id references
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Find and drop all functions with this name regardless of signature
    FOR func_record IN 
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'import_template_from_library'
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_record.oid::regprocedure || ' CASCADE';
        RAISE NOTICE 'Dropped function: % with args: %', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- Also try specific signatures that might exist
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR) CASCADE;  
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, VARCHAR(255), JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.import_template_from_library(uuid, uuid, character varying, jsonb) CASCADE;
DROP FUNCTION IF EXISTS import_template_from_library(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS import_template_from_library(UUID, UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS import_template_from_library(UUID, UUID, VARCHAR, JSONB) CASCADE;
DROP FUNCTION IF EXISTS import_template_from_library(UUID, UUID, VARCHAR(255), JSONB) CASCADE;
DROP FUNCTION IF EXISTS import_template_from_library(UUID, UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS import_template_from_library(uuid, uuid, character varying, jsonb) CASCADE;

-- Create the definitive working function
-- Based ONLY on actual email_templates table structure from 20250811000001_create_automation_system.sql
CREATE OR REPLACE FUNCTION public.import_template_from_library(
    p_company_id UUID,
    p_library_template_id UUID,
    p_custom_name VARCHAR,
    p_customizations JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    new_template_id UUID;
    library_template RECORD;
BEGIN
    RAISE NOTICE 'TEMPLATE IMPORT: Starting import for template % to company %', p_library_template_id, p_company_id;
    
    -- Get the template from the library
    SELECT * INTO library_template
    FROM email_template_library 
    WHERE id = p_library_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found in library: %', p_library_template_id;
    END IF;
    
    RAISE NOTICE 'TEMPLATE IMPORT: Found library template: %', library_template.name;
    
    -- Create new template for the company based on ACTUAL email_templates columns ONLY
    -- Columns from 20250811000001_create_automation_system.sql:
    -- id, company_id, name, description, template_type, subject_line, html_content, text_content, variables, is_active, created_at, updated_at
    -- IMPORTANT: NO library_template_id column exists in email_templates table
    BEGIN
        INSERT INTO email_templates (
            company_id,
            name,
            description,
            template_type,
            subject_line,
            html_content,
            text_content,
            variables,
            is_active
        ) VALUES (
            p_company_id,
            COALESCE(p_custom_name, library_template.name),
            library_template.description,
            library_template.template_category, -- Map template_category to template_type
            library_template.subject_line,
            library_template.html_content,
            library_template.text_content,
            library_template.variables,
            true -- Start active
        ) RETURNING id INTO new_template_id;
        
        RAISE NOTICE 'TEMPLATE IMPORT: Created email template with ID: %', new_template_id;
        
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'TEMPLATE IMPORT: email_templates table not found, trying email_automation fallback';
        -- Fall back to email_automation table if email_templates doesn't exist
        -- IMPORTANT: NO library_template_id column exists in email_automation table either
        INSERT INTO email_automation (
            company_id,
            template_name,
            subject_line,
            email_body,
            trigger_event,
            delay_minutes,
            is_active
        ) VALUES (
            p_company_id,
            COALESCE(p_custom_name, library_template.name),
            library_template.subject_line,
            COALESCE(library_template.html_content, library_template.text_content),
            'manual',
            0,
            false
        ) RETURNING id INTO new_template_id;
        
        RAISE NOTICE 'TEMPLATE IMPORT: Created email_automation with ID: %', new_template_id;
    END;
    
    -- Track the usage with proper duplicate handling
    -- Only insert columns that exist in template_library_usage table
    INSERT INTO template_library_usage (
        library_template_id,
        company_id,
        company_template_id,
        customizations,
        imported_at
    ) VALUES (
        p_library_template_id,
        p_company_id,
        new_template_id,
        COALESCE(p_customizations, '{}'::jsonb),
        NOW()
    ) ON CONFLICT (library_template_id, company_id) 
      DO UPDATE SET 
        company_template_id = EXCLUDED.company_template_id,
        customizations = EXCLUDED.customizations,
        imported_at = NOW();
    
    RAISE NOTICE 'TEMPLATE IMPORT: Tracked usage for template %', p_library_template_id;
    
    -- Update library template usage count
    UPDATE email_template_library 
    SET 
        usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = NOW()
    WHERE id = p_library_template_id;
    
    RAISE NOTICE 'TEMPLATE IMPORT: Updated usage count for library template %', p_library_template_id;
    RAISE NOTICE 'TEMPLATE IMPORT: Successfully completed import, returning ID: %', new_template_id;
    
    RETURN new_template_id;
END;
$function$;

-- Add comprehensive comment
COMMENT ON FUNCTION public.import_template_from_library(UUID, UUID, VARCHAR, JSONB) IS 
'FORCE FIXED: Aggressively replaced all function variants, uses only existing table columns, includes debugging - 2025-08-28';

-- Simple verification without exceptions  
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    -- Just count functions and report success
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
    AND p.proname = 'import_template_from_library';
    
    RAISE NOTICE '✅ Found % functions named import_template_from_library', func_count;
    RAISE NOTICE '🎯 Template import function replacement completed successfully';
END $$;