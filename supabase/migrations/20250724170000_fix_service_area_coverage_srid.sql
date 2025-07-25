-- Fix SRID mismatch in check_service_area_coverage function
-- Points need to be created with SRID 4326 to match stored polygons and center points

DROP FUNCTION IF EXISTS check_service_area_coverage(UUID, DECIMAL, DECIMAL, TEXT);

CREATE OR REPLACE FUNCTION check_service_area_coverage(
  p_company_id UUID,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_zip_code TEXT DEFAULT NULL
)
RETURNS TABLE(
  area_id UUID,
  area_name VARCHAR(255),
  area_type VARCHAR(50),
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.name,
    sa.type,
    sa.priority
  FROM service_areas sa
  WHERE sa.company_id = p_company_id 
    AND sa.is_active = true
    AND (
      -- Check polygon areas - use ST_SetSRID to ensure point has SRID 4326
      (sa.type = 'polygon' AND ST_Contains(sa.polygon, ST_SetSRID(ST_Point(p_longitude, p_latitude), 4326))) OR
      
      -- Check radius areas (using Haversine distance) - use ST_SetSRID for consistent SRID
      (sa.type = 'radius' AND 
       ST_DWithin(
         sa.center_point::geography, 
         ST_SetSRID(ST_Point(p_longitude, p_latitude), 4326)::geography,
         sa.radius_miles * 1609.34 -- Convert miles to meters
       )) OR
      
      -- Check zip code areas
      (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND p_zip_code = ANY(sa.zip_codes))
    )
  ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the fix
COMMENT ON FUNCTION check_service_area_coverage IS 'Check if a geographic point or zip code falls within any active service area for a company. Fixed to use consistent SRID 4326 for all geometric operations.';