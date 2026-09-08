ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method_id uuid REFERENCES shipping_methods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_shipping_method_id_idx
  ON orders(shipping_method_id);
