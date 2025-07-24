-- Fix function to get all service areas for a company (for admin interface)

DROP FUNCTION IF EXISTS get_company_service_areas(p_company_id UUID);

CREATE FUNCTION get_company_service_areas(p_company_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  type TEXT,
  polygon_geojson TEXT,
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_miles DECIMAL(10,2),
  zip_codes TEXT[],
  priority INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.name::TEXT,
    sa.type::TEXT,
    ST_AsGeoJSON(sa.polygon)::TEXT,
    ST_Y(sa.center_point),
    ST_X(sa.center_point),
    sa.radius_miles::DECIMAL(10,2),
    sa.zip_codes,
    sa.priority,
    sa.is_active,
    sa.created_at,
    sa.updated_at
  FROM service_areas sa
  WHERE sa.company_id = p_company_id
  ORDER BY sa.priority DESC, sa.name ASC;
END;
$$ LANGUAGE plpgsql;