ALTER TABLE route_stops
  ADD COLUMN IF NOT EXISTS manually_reassigned BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN route_stops.manually_reassigned IS
  'When true, this stop has been manually reassigned to a different route by a manager.
   The PestPac sync will preserve the current route_id and stop_order instead of
   overwriting them with PestPac data.';
