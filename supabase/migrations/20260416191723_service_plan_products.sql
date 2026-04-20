CREATE TABLE IF NOT EXISTS service_plan_products (
  plan_id    UUID NOT NULL REFERENCES service_plans(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (plan_id, product_id)
);

CREATE INDEX idx_service_plan_products_plan_id    ON service_plan_products(plan_id);
CREATE INDEX idx_service_plan_products_product_id ON service_plan_products(product_id);
