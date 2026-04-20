-- Tracks which leads each user has opened. Drives the "unread" highlight on
-- inbox-style card views (Field Sales → New Leads). A row is inserted the
-- first time a user clicks through to a lead; subsequent clicks are no-ops
-- because the (user_id, lead_id) primary key makes the insert idempotent.

create table public.lead_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, lead_id)
);

create index lead_views_lead_id_idx on public.lead_views(lead_id);

alter table public.lead_views enable row level security;

create policy "lead_views_select_own"
  on public.lead_views for select
  using (auth.uid() = user_id);

create policy "lead_views_insert_own"
  on public.lead_views for insert
  with check (auth.uid() = user_id);
