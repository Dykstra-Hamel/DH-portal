-- Section 1: Drop is_primary from quote_line_items
ALTER TABLE quote_line_items DROP COLUMN IF EXISTS is_primary;

-- Section 2: Add is_featured to service_plans
ALTER TABLE service_plans ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Section 3: Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_category TEXT,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  unit_type TEXT DEFAULT 'each',
  default_quantity INTEGER DEFAULT 1,
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  sku TEXT,
  product_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add product_id FK to quote_line_items
ALTER TABLE quote_line_items
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Update type-exclusivity check constraint to include product_id
ALTER TABLE quote_line_items DROP CONSTRAINT IF EXISTS check_line_item_type;
ALTER TABLE quote_line_items ADD CONSTRAINT check_line_item_type CHECK (
  (
    (service_plan_id IS NOT NULL)::int +
    (addon_service_id IS NOT NULL)::int +
    (bundle_plan_id IS NOT NULL)::int +
    (product_id IS NOT NULL)::int
  ) <= 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(company_id, is_active);
