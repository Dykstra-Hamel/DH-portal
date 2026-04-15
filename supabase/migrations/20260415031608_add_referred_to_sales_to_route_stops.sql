alter table public.route_stops
  add column if not exists referred_to_sales boolean not null default false;
