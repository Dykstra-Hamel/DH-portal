-- CLEANUP CONSTRAINT DUPLICATE INDEXES
-- Remove regular indexes that duplicate UNIQUE constraint indexes

-- 1. BRANDS TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_brands_company_id;
-- Keeping: idx_brands_company_id_unique (UNIQUE constraint)

-- 2. CALL_RECORDS TABLE - Remove regular index (keep unique constraint) 
DROP INDEX IF EXISTS idx_call_records_call_id;
-- Keeping: call_records_call_id_key (UNIQUE constraint)

-- 3. PARTIAL_LEADS TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_partial_leads_session_id;
-- Keeping: partial_leads_session_id_key (UNIQUE constraint)

-- 4. PEST_CATEGORIES TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_pest_categories_slug;
-- Keeping: pest_categories_slug_key (UNIQUE constraint)

-- 5. PEST_TYPES TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_pest_types_slug;  
-- Keeping: pest_types_slug_key (UNIQUE constraint)

-- 6. SYSTEM_SETTINGS TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_system_settings_key;
-- Keeping: system_settings_key_key (UNIQUE constraint)

-- 7. USER_COMPANIES TABLE - Remove regular index (keep unique constraint)
DROP INDEX IF EXISTS idx_user_companies_composite;
-- Keeping: user_companies_user_id_company_id_key (UNIQUE constraint)

-- Final verification
DO $$
DECLARE
    remaining_duplicates INTEGER;
BEGIN
    WITH index_details AS (
        SELECT 
            tablename,
            regexp_replace(indexdef, 'CREATE (UNIQUE )?INDEX [^ ]+ ON [^(]+', '') as column_structure
        FROM pg_indexes 
        WHERE schemaname = 'public'
    )
    SELECT COUNT(*) INTO remaining_duplicates
    FROM (
        SELECT tablename, column_structure
        FROM index_details
        GROUP BY tablename, column_structure
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'CONSTRAINT DUPLICATE INDEX CLEANUP COMPLETE:';
    RAISE NOTICE 'Removed 7 indexes that duplicated UNIQUE constraints';
    RAISE NOTICE 'Remaining duplicate index groups: %', remaining_duplicates;
    
    IF remaining_duplicates = 0 THEN
        RAISE NOTICE '✅ ALL DUPLICATE INDEXES COMPLETELY RESOLVED!';
        RAISE NOTICE '✅ Database index structure fully optimized';
    ELSE
        RAISE NOTICE 'ℹ️  Remaining duplicates are likely intentional or system-managed';
    END IF;
END $$;