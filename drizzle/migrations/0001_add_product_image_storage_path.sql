-- Adds the Supabase Storage object path to product_images so uploaded files
-- can be deleted from Storage later (a public image_url alone cannot be
-- reliably converted back into a storage path).
--
-- Safe to run against an existing, populated database: it only adds a
-- nullable column and does not touch existing rows or other tables.
--
-- This project has no prior checked-in migration history (schema was kept in
-- sync via `drizzle-kit push`). If that is still your workflow, prefer:
--   npx drizzle-kit push
-- which will apply this same change (and only this change) by diffing
-- src/db/schema.ts against your live database. This file is provided for
-- teams that run versioned migrations instead.

ALTER TABLE "product_images"
  ADD COLUMN IF NOT EXISTS "storage_path" text;
