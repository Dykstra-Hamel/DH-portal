-- Add compound UNIQUE constraints to enable idempotent upserts from PestPac sync

ALTER TABLE routes
  ADD CONSTRAINT uq_routes_company_pestpac
  UNIQUE (company_id, pestpac_route_id);

ALTER TABLE route_stops
  ADD CONSTRAINT uq_route_stops_company_pestpac
  UNIQUE (company_id, pestpac_stop_id);
