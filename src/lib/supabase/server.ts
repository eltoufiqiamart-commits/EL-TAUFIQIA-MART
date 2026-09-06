import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key.
 *
 * SECURITY: this module must never be imported from a "use client"
 * component or any code that ships to the browser. The `server-only`
 * import above makes any accidental client-side import fail at build
 * time. The service-role key bypasses Row Level Security entirely, so
 * every caller of `getSupabaseAdmin()` is responsible for doing its own
 * authentication/authorization/ownership checks *before* touching
 * Storage — see src/lib/product-images.ts.
 */

const PRODUCT_IMAGES_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Storage is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the server."
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedClient;
}

export function getProductImagesBucket(): string {
  return PRODUCT_IMAGES_BUCKET;
}

/**
 * Ensures the product-images bucket exists and is public (customers must be
 * able to view published product images without authenticating). Safe to
 * call repeatedly — it's a no-op if the bucket already exists. Failures are
 * swallowed into a returned boolean rather than thrown, because bucket
 * creation may legitimately fail under a service-role key whose Storage
 * admin permissions were intentionally restricted (bucket already created
 * manually via the Supabase dashboard, which is the documented setup path).
 */
export async function ensureProductImagesBucket(): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const bucket = getProductImagesBucket();

  const { data: existing, error: getError } = await supabase.storage.getBucket(bucket);
  if (existing && !getError) return true;

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  if (createError) {
    console.error(`[supabase] Could not auto-create bucket "${bucket}":`, createError.message);
    return false;
  }
  return true;
}
