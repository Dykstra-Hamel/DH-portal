ALTER TABLE quotes
  ADD COLUMN subtotal_initial_price  DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN subtotal_recurring_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
