alter table service_plans
  add column if not exists default_variant_label text default null;
