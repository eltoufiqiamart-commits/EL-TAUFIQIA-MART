# Product Image Uploads — Supabase Storage Setup

This project stores product images in **Supabase Storage**, not in `/public`
or on the local filesystem. This document covers the one-time Supabase
configuration and how the upload flow works.

## 1. Required environment variables

Set these in `.env.local` for development and in your host's environment
variable settings (Vercel, etc.) for production/preview. Never commit real
values — see `.env.example` for the full list with comments.

| Variable | Where it's used | Notes |
|---|---|---|
| `SUPABASE_URL` | server only | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | **Never** expose this to the browser or prefix it with `NEXT_PUBLIC_` |
| `SUPABASE_STORAGE_BUCKET` | server only | Optional, defaults to `product-images` |
| `NEXT_PUBLIC_SUPABASE_URL` | browser-safe | Currently unused by the upload flow (uploads go through our own API, not directly from the browser to Supabase), kept for future client-side Supabase usage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser-safe | Same as above |

The service-role client lives only in `src/lib/supabase/server.ts`, which
imports the `server-only` package — any accidental import from client
component code will fail the build rather than silently shipping the key to
the browser.

## 2. Storage bucket

Bucket name: **`product-images`** (override with `SUPABASE_STORAGE_BUCKET`).

The server will try to create this bucket automatically (as **public**, 10MB
per-file limit, JPEG/PNG/WebP only) the first time an image is uploaded, via
`ensureProductImagesBucket()` in `src/lib/supabase/server.ts`. This call is
idempotent and failure-tolerant: if your service-role key doesn't have
Storage-admin permission to create buckets, upload will still work as long
as you create the bucket yourself first:

1. Supabase Dashboard → Storage → **New bucket**
2. Name: `product-images`
3. Public bucket: **Yes** (customers need to view images without
   authenticating)
4. File size limit: 10MB (matches the server-side limit enforced in
   `src/lib/product-images.ts`)
5. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

## 3. Storage policies

All Storage writes (upload/delete) go through our own server-side API using
the **service-role key**, which bypasses Row Level Security / Storage
policies entirely. The application performs its own authentication,
authorization, and ownership checks in `src/lib/product-images.ts` and the
`/api/seller/products/[id]/images*` routes before ever touching Storage.

**Important:** the app uses its own custom JWT session system
(`src/lib/auth.ts`), not Supabase Auth. `auth.uid()` in a Supabase RLS policy
would **not** correspond to this app's user IDs, so no such policy is
relied upon here — don't add one expecting it to enforce anything for this
app's uploads.

If you want a defense-in-depth policy on the bucket itself (in case the
service-role key is ever used from an unexpected context), you can restrict
the bucket to read-only for the `anon`/`authenticated` Supabase roles and
rely entirely on the app's server-side checks for writes — which is already
the default for a bucket with no INSERT/UPDATE/DELETE policies defined for
those roles.

Public **read** access is provided by the bucket's "public" flag (public
buckets serve objects over a public URL with no auth required), which is
what lets customers view product images without logging in.

## 4. Database migration

A new nullable `storage_path` column was added to `product_images` (needed
so the server can delete the underlying Storage object later — a public
`image_url` alone can't be reliably converted back into a Storage path).

This project has no prior checked-in migration history (schema appears to
have been kept in sync via `drizzle-kit push` directly). Two ways to apply
this one additive change:

- **Recommended, if you use `drizzle-kit push`:** run
  ```
  npx drizzle-kit push
  ```
  It will diff `src/db/schema.ts` against your live database and add only
  the new column.

- **If you use versioned migrations:** run the SQL in
  `drizzle/migrations/0001_add_product_image_storage_path.sql` directly
  against your database. It's a single `ADD COLUMN IF NOT EXISTS` — safe to
  run against an existing, populated database.

No other schema changes were needed — `products.main_image_url` and
`product_images` already existed and are used as described below.

## 5. How it works

- **Source of truth:** `product_images` (one row per image, with
  `display_order` and `is_primary`).
- **Legacy/cache field:** `products.main_image_url` is kept in sync
  automatically (by `src/lib/product-images.ts`) to always mirror the
  current primary image's URL. This is what lets existing read paths —
  product listing, search, cart, checkout, order snapshots, `ProductCard`
  — keep working unchanged; they all read `mainImageUrl` and never needed
  to be touched.
- **Upload flow:**
  1. Seller selects a file in the browser (new-product page: local preview
     only, upload happens once the product is created; edit page: uploads
     immediately).
  2. Browser sends the raw file as `multipart/form-data` to
     `POST /api/seller/products/{id}/images`.
  3. The route checks: session exists → role is `seller`/`admin` → seller
     profile is `approved` → seller owns product `{id}`.
  4. `validateAndProcessImage()` decodes the file with `sharp` — this is the
     real validation step (libvips reads the actual bytes, so a renamed
     non-image file fails here regardless of the browser-reported MIME
     type), then resizes (max 2000px), strips metadata, and re-encodes as
     WebP.
  5. The processed file is uploaded to
     `products/{sellerId}/{productId}/{uuid}.webp` — all three path segments
     are server-derived, never taken from client input, so path traversal
     and cross-seller/cross-product writes are structurally impossible.
  6. A `product_images` row is inserted (first image for a product becomes
     primary automatically), and `products.main_image_url` is refreshed.
- **Delete:** `DELETE /api/seller/products/{id}/images/{imageId}` — same
  ownership check, then deletes the DB row first, then best-effort removes
  the Storage object. If the deleted image was primary, the next image (by
  display order) is automatically promoted to primary; a product is never
  left pointing at a deleted primary image.
- **Set primary / reorder:**
  `PATCH /api/seller/products/{id}/images/{imageId}` (`{ isPrimary: true }`)
  and `PATCH /api/seller/products/{id}/images` (`{ order: [id, id, ...] }`).

## 6. Local development

1. Copy `.env.example` to `.env.local` and fill in real values.
2. Create the Storage bucket (Section 2) — or just try an upload once your
   dev server is running; auto-creation will handle it if your service-role
   key allows it.
3. `npm run dev`, log in as an approved seller, and use
   **Seller Dashboard → Add Product** or **Edit Product** to upload images.

## 7. Production / Vercel

- Set all variables from Section 1 in your Vercel project's Environment
  Variables (Production and Preview). Do not add `NEXT_PUBLIC_` to
  `SUPABASE_SERVICE_ROLE_KEY`.
- Run the migration from Section 4 against your production database before
  deploying the new code (the new column is additive/nullable, so this is
  safe to do ahead of the deploy).
- Confirm the `product-images` bucket exists and is public in your
  production Supabase project (Storage buckets are per-project — a bucket
  created in a dev project does not carry over).
