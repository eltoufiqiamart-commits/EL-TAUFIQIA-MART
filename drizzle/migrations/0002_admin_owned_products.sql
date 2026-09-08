-- Allow products to be owned by the store/admin without a seller account.
-- Existing seller IDs are preserved; no rows are deleted.
ALTER TABLE products ALTER COLUMN seller_id DROP NOT NULL;
