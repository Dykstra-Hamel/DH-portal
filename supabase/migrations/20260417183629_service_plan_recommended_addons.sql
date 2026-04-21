CREATE TABLE IF NOT EXISTS service_plan_recommended_addons (
  plan_id  UUID NOT NULL REFERENCES service_plans(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES add_on_services(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, addon_id)
);
