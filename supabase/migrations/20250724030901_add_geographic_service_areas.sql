-- Add geographic service area support to companies table
-- This migration extends the existing widget_config JSONB column structure

-- Add PostGIS extension if not already enabled (for geographic functions)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create a new table for geographic service areas
CREATE TABLE IF NOT EXISTS service_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('polygon', 'radius', 'zip_code')),
  
  -- For polygon areas: store as PostGIS geometry
  polygon GEOMETRY(POLYGON, 4326),
  
  -- For radius areas: center point and radius in miles
  center_point GEOMETRY(POINT, 4326),
  radius_miles DECIMAL(10,2),
  
  -- For zip code areas: store as array of zip codes
  zip_codes TEXT[],
  
  -- Priority for overlapping areas (higher number = higher priority)
  priority INTEGER DEFAULT 0,
  
  -- Active status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure at least one area definition is provided
  CONSTRAINT check_area_definition CHECK (
    (type = 'polygon' AND polygon IS NOT NULL) OR
    (type = 'radius' AND center_point IS NOT NULL AND radius_miles IS NOT NULL) OR
    (type = 'zip_code' AND zip_codes IS NOT NULL AND array_length(zip_codes, 1) > 0)
  )
);

-- Create indexes for efficient geographic queries
CREATE INDEX IF NOT EXISTS idx_service_areas_company_id ON service_areas(company_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_type ON service_areas(type);
CREATE INDEX IF NOT EXISTS idx_service_areas_active ON service_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_service_areas_polygon ON service_areas USING GIST(polygon) WHERE polygon IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_areas_center_point ON service_areas USING GIST(center_point) WHERE center_point IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_areas_zip_codes ON service_areas USING GIN(zip_codes) WHERE zip_codes IS NOT NULL;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_service_areas_updated_at
  BEFORE UPDATE ON service_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_service_areas_updated_at();

-- Create function to check if a point is within any service area for a company
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
      -- Check polygon areas
      (sa.type = 'polygon' AND ST_Contains(sa.polygon, ST_Point(p_longitude, p_latitude))) OR
      
      -- Check radius areas (using Haversine distance)
      (sa.type = 'radius' AND 
       ST_DWithin(
         sa.center_point::geography, 
         ST_Point(p_longitude, p_latitude)::geography,
         sa.radius_miles * 1609.34 -- Convert miles to meters
       )) OR
      
      -- Check zip code areas
      (sa.type = 'zip_code' AND p_zip_code IS NOT NULL AND p_zip_code = ANY(sa.zip_codes))
    )
  ORDER BY sa.priority DESC, sa.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all service areas for a company (for admin interface)
CREATE OR REPLACE FUNCTION get_company_service_areas(p_company_id UUID)
RETURNS TABLE(
  id UUID,
  name VARCHAR(255),
  type VARCHAR(50),
  polygon_geojson TEXT,
  center_lat DECIMAL,
  center_lng DECIMAL,
  radius_miles DECIMAL,
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
    sa.name,
    sa.type,
    CASE 
      WHEN sa.polygon IS NOT NULL 
      THEN ST_AsGeoJSON(sa.polygon)::TEXT 
      ELSE NULL 
    END as polygon_geojson,
    CASE 
      WHEN sa.center_point IS NOT NULL 
      THEN ST_Y(sa.center_point) 
      ELSE NULL 
    END as center_lat,
    CASE 
      WHEN sa.center_point IS NOT NULL 
      THEN ST_X(sa.center_point) 
      ELSE NULL 
    END as center_lng,
    sa.radius_miles,
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

-- Add RLS (Row Level Security) policies
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access service areas for companies they have access to
-- This assumes there's a proper access control system in place
CREATE POLICY "Users can access service areas for their companies" ON service_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM companies c 
      WHERE c.id = service_areas.company_id
      -- Add additional access control logic here based on your auth system
    )
  );

-- Update widget_config documentation
COMMENT ON COLUMN companies.widget_config IS 'Widget configuration including AI knowledge base, branding, service areas, and geographic coverage settings';

-- Add comments for new table and functions
COMMENT ON TABLE service_areas IS 'Geographic service areas for companies including polygon, radius, and zip code based coverage areas';
COMMENT ON FUNCTION check_service_area_coverage IS 'Check if a geographic point or zip code falls within any active service area for a company';
COMMENT ON FUNCTION get_company_service_areas IS 'Retrieve all service areas for a company with geographic data formatted for admin interface';