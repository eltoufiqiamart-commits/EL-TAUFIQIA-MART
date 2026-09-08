ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_name varchar(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_phone varchar(30);
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_address text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_notes text;
