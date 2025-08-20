-- FIX PostGIS SCHEMA REFERENCES IN get_company_service_areas FUNCTION
-- PostGIS functions are in extensions schema, not public schema

-- Drop and recreate function with correct PostGIS schema references
DROP FUNCTION IF EXISTS public.get_company_service_areas(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.get_company_service_areas(p_company_id UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    type TEXT,
    polygon_geojson TEXT,
    center_lat TEXT,
    center_lng TEXT,
    radius_miles DECIMAL(10,2),
    zip_codes TEXT[],
    priority INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        sa.id,
        sa.name::TEXT,
        sa.type::TEXT,
        CASE 
            WHEN sa.polygon IS NOT NULL THEN extensions.ST_AsGeoJSON(sa.polygon)::TEXT
            ELSE NULL
        END as polygon_geojson,
        CASE 
            WHEN sa.center_point IS NOT NULL THEN extensions.ST_Y(sa.center_point)::TEXT
            ELSE NULL
        END as center_lat,
        CASE 
            WHEN sa.center_point IS NOT NULL THEN extensions.ST_X(sa.center_point)::TEXT
            ELSE NULL
        END as center_lng,
        sa.radius_miles::DECIMAL(10,2),
        sa.zip_codes,
        sa.priority,
        sa.is_active,
        sa.created_at,
        sa.updated_at
    FROM public.service_areas sa
    WHERE sa.company_id = p_company_id
    ORDER BY sa.priority DESC, sa.name ASC;
END;
$function$;

-- Add comment documenting this fix
COMMENT ON FUNCTION public.get_company_service_areas(UUID) IS 'Returns complete service area data with geographic fields - PostGIS functions in extensions schema - 2025-08-20';