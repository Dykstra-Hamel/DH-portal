-- ADD MISSING POSTGIS GEOMETRY COLUMNS TO service_areas TABLE
-- The table is missing polygon and center_point columns that the function expects

-- Add the missing PostGIS geometry columns
ALTER TABLE public.service_areas 
ADD COLUMN IF NOT EXISTS polygon GEOMETRY(POLYGON, 4326),
ADD COLUMN IF NOT EXISTS center_point GEOMETRY(POINT, 4326);

-- Add spatial indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_areas_polygon 
ON public.service_areas USING GIST(polygon) 
WHERE polygon IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_areas_center_point 
ON public.service_areas USING GIST(center_point) 
WHERE center_point IS NOT NULL;

-- Add check constraint to ensure proper data based on type
ALTER TABLE public.service_areas DROP CONSTRAINT IF EXISTS service_areas_data_integrity_check;
ALTER TABLE public.service_areas ADD CONSTRAINT service_areas_data_integrity_check CHECK (
    (type = 'polygon' AND polygon IS NOT NULL) OR
    (type = 'radius' AND center_point IS NOT NULL AND radius_miles IS NOT NULL) OR
    (type = 'zip_code' AND zip_codes IS NOT NULL AND array_length(zip_codes, 1) > 0)
);

-- Add comment documenting this fix
COMMENT ON TABLE public.service_areas IS 'Geographic service areas for companies including polygon, radius, and zip code based coverage areas - PostGIS columns added 2025-08-20';