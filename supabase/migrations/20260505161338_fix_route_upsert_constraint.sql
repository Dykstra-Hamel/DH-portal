-- Fix route upsert constraint to include assigned_to, preventing cross-user overwrites
-- when multiple technicians share the same PestPac route ID (team routes).
-- The 3-column constraint gives each user their own route row per PestPac route.

ALTER TABLE routes DROP CONSTRAINT uq_routes_company_pestpac;

ALTER TABLE routes ADD CONSTRAINT uq_routes_company_pestpac_user
  UNIQUE (company_id, pestpac_route_id, assigned_to);
