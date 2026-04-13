-- Add map_plot_data JSONB column to leads table
-- Stores the serialized MapPlotData from Field Map wizard inspections
-- (stamps, outlines, photos, coordinates) directly on the lead record.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS map_plot_data JSONB DEFAULT NULL;

COMMENT ON COLUMN leads.map_plot_data IS
  'Serialized MapPlotData from Field Map wizard inspection (stamps, outlines, photos, coordinates)';
