ALTER TABLE quotes
  ADD COLUMN applied_discount_id UUID REFERENCES company_discounts(id) ON DELETE SET NULL;
