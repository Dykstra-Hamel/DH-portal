-- Create weather_cache table to store weather data from Open-Meteo API
-- This table caches historical and forecast weather data to minimize API calls

CREATE TABLE weather_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Location (part of unique key)
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  city VARCHAR(255),
  state VARCHAR(2),

  -- Date (part of unique key)
  date DATE NOT NULL,

  -- Weather data (all in imperial units)
  temp_max_f DECIMAL(5, 2),
  temp_min_f DECIMAL(5, 2),
  temp_avg_f DECIMAL(5, 2),
  precipitation_inches DECIMAL(5, 2),
  humidity_avg_percent DECIMAL(5, 2),

  -- API metadata
  data_source VARCHAR(50) DEFAULT 'open-meteo',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per location per date
  UNIQUE(lat, lng, date)
);

-- Create indexes for efficient queries
CREATE INDEX idx_weather_cache_location ON weather_cache(lat, lng);
CREATE INDEX idx_weather_cache_date ON weather_cache(date DESC);
CREATE INDEX idx_weather_cache_location_date ON weather_cache(lat, lng, date DESC);
CREATE INDEX idx_weather_cache_city_state ON weather_cache(city, state) WHERE city IS NOT NULL;
CREATE INDEX idx_weather_cache_fetched_at ON weather_cache(fetched_at);

-- Enable RLS
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (weather data is global, readable by all authenticated users)
CREATE POLICY "Authenticated users can view weather cache" ON weather_cache
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage weather cache" ON weather_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Add helpful comments
COMMENT ON TABLE weather_cache IS 'Caches weather data from Open-Meteo API to minimize external calls. Data is location + date specific.';
COMMENT ON COLUMN weather_cache.lat IS 'Latitude (rounded to 4 decimals for grouping similar locations)';
COMMENT ON COLUMN weather_cache.lng IS 'Longitude (rounded to 4 decimals for grouping similar locations)';
COMMENT ON COLUMN weather_cache.temp_avg_f IS 'Calculated average: (temp_max_f + temp_min_f) / 2';
COMMENT ON COLUMN weather_cache.precipitation_inches IS 'Total precipitation for the day (converted from mm)';
COMMENT ON COLUMN weather_cache.humidity_avg_percent IS 'Average relative humidity 0-100%';
COMMENT ON COLUMN weather_cache.data_source IS 'API source (always open-meteo for now, allows future sources)';

-- Create function to clean up old cache entries (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_weather_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete weather data older than 3 years
  DELETE FROM weather_cache
  WHERE date < CURRENT_DATE - INTERVAL '3 years';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_weather_cache IS 'Deletes weather cache entries older than 3 years. Run periodically via cron/inngest.';
