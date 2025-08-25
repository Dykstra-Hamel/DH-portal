-- Fix function return type mismatch
-- The function declares TEXT but table has VARCHAR(255)

-- Drop and recreate with correct return types matching the table schema
DROP FUNCTION IF EXISTS public.check_service_area_coverage(uuid, numeric, numeric, text);

CREATE OR REPLACE FUNCTION public.check_service_area_coverage(
    p_company_id UUID,
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_zip_code TEXT DEFAULT NULL
)
RETURNS TABLE (
    area_id UUID,
    area_name VARCHAR(255),  -- Match table schema
    area_type VARCHAR(50),   -- Match table schema
    is_covered BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'  -- Include extensions for PostGIS access
AS $$
BEGIN
    -- Return all matching service areas with coverage status
    RETURN QUERY
    SELECT 
        sa.id as area_id,
        sa.name as area_name,
        sa.type as area_type,
        true as is_covered  -- If returned, it means the area is covered
    FROM public.service_areas sa
    WHERE sa.company_id = p_company_id 
        AND sa.is_active = true
        AND (
            -- Check polygon areas (using PostGIS functions)
            (sa.type = 'polygon' AND sa.polygon IS NOT NULL AND 
             extensions.ST_Contains(sa.polygon, extensions.ST_Point(p_longitude::double precision, p_latitude::double precision))) OR
            
            -- Check radius areas (using geographic distance)
            (sa.type = 'radius' AND sa.center_point IS NOT NULL AND sa.radius_miles IS NOT NULL AND 
             extensions.ST_DWithin(
                 sa.center_point::extensions.geography, 
                 extensions.ST_Point(p_longitude::double precision, p_latitude::double precision)::extensions.geography,
                 sa.radius_miles * 1609.34 -- Convert miles to meters
             )) OR
            
            -- Check zip code areas
            (sa.type = 'zip_code' AND sa.zip_codes IS NOT NULL AND p_zip_code IS NOT NULL AND 
             p_zip_code = ANY(sa.zip_codes))
        )
    ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_service_area_coverage(uuid, numeric, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_service_area_coverage(uuid, numeric, numeric, text) TO anon;

-- Add comment documenting this fix
COMMENT ON FUNCTION public.check_service_area_coverage(uuid, numeric, numeric, text) IS 'Check if a geographic point or zip code falls within any active service area for a company - Fixed return type mismatch 2025-08-22';