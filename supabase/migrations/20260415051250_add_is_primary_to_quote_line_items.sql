alter table public.quote_line_items
  add column if not exists is_primary boolean not null default true;
