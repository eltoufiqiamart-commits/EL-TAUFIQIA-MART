import "server-only";
import sharp, { type Sharp, type Metadata } from "sharp";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { productImages, products, sellerProfiles } from "@/db/schema";
import { ensureProductImagesBucket, getProductImagesBucket, getSupabaseAdmin } from "@/lib/supabase/server";

// ─── Config ─────────────────────────────────────────────────────────────────

// Reject the raw upload above this size before we ever decode it with sharp,
// so a huge file can't be used to exhaust memory/CPU during processing.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_DIMENSION = 2000; // px, longest side after resize
const WEBP_QUALITY = 82;

// Formats we accept. Never trust the browser-supplied File.type for this —
// ACCEPTED_FORMATS is only used to shape the initial rejection message; the
// real check is what sharp's libvips decoder reports after reading the
// actual file bytes (see validateAndDecode below).
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export class OwnershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OwnershipError";
  }
}

// ─── Ownership ──────────────────────────────────────────────────────────────

export interface OwnedProductContext {
  sellerProfileId: string;
  productId: string;
}

/**
 * Confirms that the given session's seller profile is approved AND owns the
 * given product. Throws OwnershipError otherwise. Every image mutation
 * (upload/delete/reorder/set-primary) must go through this first — the
 * seller/product IDs used for the storage path and DB writes always come
 * from this server-side lookup, never from client-supplied fields.
 */
export async function requireOwnedProduct(
  userId: string,
  productId: string
): Promise<OwnedProductContext> {
  const [sellerProfile] = await db
    .select({ id: sellerProfiles.id, status: sellerProfiles.status })
    .from(sellerProfiles)
    .where(eq(sellerProfiles.profileId, userId))
    .limit(1);

  if (!sellerProfile || sellerProfile.status !== "approved") {
    throw new OwnershipError("حساب البائع غير معتمد");
  }

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.sellerId, sellerProfile.id)))
    .limit(1);

  if (!product) {
    throw new OwnershipError("المنتج غير موجود أو لا يخصك");
  }

  return { sellerProfileId: sellerProfile.id, productId: product.id };
}

// ─── Validation + processing ────────────────────────────────────────────────

interface ProcessedImage {
  buffer: Buffer;
  contentType: "image/webp";
  extension: "webp";
}

/**
 * Decodes and re-encodes an uploaded image, and doubles as the real
 * validation step: sharp/libvips parses the actual file bytes, so a
 * renamed .exe or a corrupt/malicious file with a spoofed MIME type fails
 * here regardless of what the browser claimed. Also strips EXIF/metadata,
 * caps dimensions, and converts to WebP for consistent, compact storage.
 */
export async function validateAndProcessImage(bytes: ArrayBuffer): Promise<ProcessedImage> {
  if (bytes.byteLength === 0) {
    throw new ImageValidationError("الملف فارغ");
  }
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError("حجم الصورة أكبر من الحد المسموح (10 ميجابايت)");
  }

  const inputBuffer = Buffer.from(bytes);
  let pipeline: Sharp;
  let metadata: Metadata;

  try {
    pipeline = sharp(inputBuffer, { failOn: "error" });
    metadata = await pipeline.metadata();
  } catch {
    throw new ImageValidationError("الملف تالف أو ليس صورة صالحة");
  }

  const format = metadata.format;
  if (!format || !ACCEPTED_FORMATS.has(format)) {
    throw new ImageValidationError("صيغة الصورة غير مدعومة. الصيغ المسموحة: JPEG, PNG, WebP");
  }

  if (!metadata.width || !metadata.height) {
    throw new ImageValidationError("تعذّرت قراءة أبعاد الصورة");
  }

  // Guard against decompression-bomb style images (tiny file, huge pixel
  // dimensions) before we ask sharp to actually resize/re-encode it.
  const MAX_PIXELS = 40_000_000; // 40MP
  if (metadata.width * metadata.height > MAX_PIXELS) {
    throw new ImageValidationError("أبعاد الصورة كبيرة جدًا");
  }

  try {
    const outputBuffer = await sharp(inputBuffer, { failOn: "error" })
      .rotate() // apply EXIF orientation, then metadata is stripped below
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    return { buffer: outputBuffer, contentType: "image/webp", extension: "webp" };
  } catch {
    throw new ImageValidationError("تعذّرت معالجة الصورة");
  }
}

// ─── Storage path ───────────────────────────────────────────────────────────

/**
 * Builds a storage path from server-derived IDs only (never from any
 * user-supplied filename or path fragment), so path traversal and
 * cross-seller/cross-product writes are structurally impossible.
 */
function buildStoragePath(sellerId: string, productId: string, extension: string): string {
  return `products/${sellerId}/${productId}/${randomUUID()}.${extension}`;
}

// ─── High-level operations ──────────────────────────────────────────────────

export interface StoredProductImage {
  id: string;
  imageUrl: string;
  storagePath: string;
  isPrimary: boolean;
  displayOrder: number;
}

/**
 * Full upload flow for one image: validate/process the bytes, upload to
 * Supabase Storage under a safe server-derived path, insert the DB record,
 * and keep products.mainImageUrl (the legacy/denormalized field several
 * read paths still rely on) in sync with the primary image.
 */
export async function uploadProductImage(
  ctx: OwnedProductContext,
  bytes: ArrayBuffer
): Promise<StoredProductImage> {
  const processed = await validateAndProcessImage(bytes);
  const path = buildStoragePath(ctx.sellerProfileId, ctx.productId, processed.extension);

  await ensureProductImagesBucket();
  const supabase = getSupabaseAdmin();
  const bucket = getProductImagesBucket();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, processed.buffer, {
      contentType: processed.contentType,
      upsert: false,
      cacheControl: "31536000",
    });

  if (uploadError) {
    throw new Error(`فشل رفع الصورة إلى المخزن: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
  const imageUrl = publicUrlData.publicUrl;

  try {
    const existingCount = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, ctx.productId));

    const isFirstImage = existingCount.length === 0;

    const [row] = await db
      .insert(productImages)
      .values({
        productId: ctx.productId,
        imageUrl,
        storagePath: path,
        displayOrder: existingCount.length,
        isPrimary: isFirstImage,
      })
      .returning();

    if (isFirstImage) {
      await syncMainImageUrl(ctx.productId);
    }

    return {
      id: row.id,
      imageUrl: row.imageUrl,
      storagePath: path,
      isPrimary: row.isPrimary,
      displayOrder: row.displayOrder,
    };
  } catch (dbError) {
    // Best-effort cleanup: don't leave an orphaned Storage object if the DB
    // insert failed after the upload succeeded.
    await supabase.storage.from(bucket).remove([path]).catch(() => {});
    throw dbError;
  }
}

/**
 * Deletes one image (Storage object + DB row), scoped to the owned product.
 * If the deleted image was primary, promotes the next image (by display
 * order) to primary and keeps products.mainImageUrl in sync. Never leaves a
 * product pointing at a deleted primary image.
 */
export async function deleteProductImage(
  ctx: OwnedProductContext,
  imageId: string
): Promise<void> {
  const [image] = await db
    .select()
    .from(productImages)
    .where(and(eq(productImages.id, imageId), eq(productImages.productId, ctx.productId)))
    .limit(1);

  if (!image) {
    throw new ImageValidationError("الصورة غير موجودة");
  }

  const supabase = getSupabaseAdmin();
  const bucket = getProductImagesBucket();

  // The row deletion, primary-promotion, and mainImageUrl sync are all pure
  // Postgres writes with no external side effects, so they're wrapped in one
  // transaction: either the product ends up fully consistent (deleted image
  // gone, a valid new primary chosen if needed, mainImageUrl matching it) or
  // nothing changes and the caller sees the original error. This avoids the
  // partial-failure case where the row is gone but no replacement primary
  // was chosen, or mainImageUrl fell out of sync with product_images.
  await db.transaction(async (tx) => {
    await tx.delete(productImages).where(eq(productImages.id, imageId));

    if (image.isPrimary) {
      const [next] = await tx
        .select()
        .from(productImages)
        .where(eq(productImages.productId, ctx.productId))
        .orderBy(productImages.displayOrder)
        .limit(1);

      if (next) {
        await tx.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, next.id));
      }
    }

    // Inlined rather than calling the shared syncMainImageUrl() helper below
    // so this runs against `tx` (same transaction) instead of a fresh `db`
    // connection/transaction context.
    const [primaryAfterDelete] = await tx
      .select({ imageUrl: productImages.imageUrl })
      .from(productImages)
      .where(and(eq(productImages.productId, ctx.productId), eq(productImages.isPrimary, true)))
      .limit(1);

    await tx
      .update(products)
      .set({ mainImageUrl: primaryAfterDelete?.imageUrl ?? null, updatedAt: new Date() })
      .where(eq(products.id, ctx.productId));
  });

  if (image.storagePath) {
    // Storage cleanup happens after the DB transaction has committed, so a
    // failure here never leaves a dangling reference in the database; a
    // leftover Storage object with no DB row is harmless (it's simply never
    // linked/served again). This is a best-effort compensating action, not
    // a rollback — Storage and Postgres cannot share one native transaction.
    await supabase.storage.from(bucket).remove([image.storagePath]).catch((err) => {
      console.error("[product-images] failed to remove storage object:", err);
    });
  }
}

/**
 * Sets one image as the primary image for the product (unsetting any other
 * primary flag), scoped to the owned product. The unset-all + set-one +
 * mainImageUrl sync are wrapped in one transaction so a product can never
 * be observed with zero or multiple primary images, or with mainImageUrl
 * pointing at something other than the actual primary row.
 */
export async function setPrimaryProductImage(
  ctx: OwnedProductContext,
  imageId: string
): Promise<void> {
  const [image] = await db
    .select({ id: productImages.id, imageUrl: productImages.imageUrl })
    .from(productImages)
    .where(and(eq(productImages.id, imageId), eq(productImages.productId, ctx.productId)))
    .limit(1);

  if (!image) {
    throw new ImageValidationError("الصورة غير موجودة");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, ctx.productId));

    await tx.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, imageId));

    await tx
      .update(products)
      .set({ mainImageUrl: image.imageUrl, updatedAt: new Date() })
      .where(eq(products.id, ctx.productId));
  });
}

/**
 * Persists a new display order for a product's images, scoped to the owned
 * product. `orderedImageIds` must be exactly the set of image IDs currently
 * belonging to the product (extra/missing/foreign IDs are rejected).
 */
export async function reorderProductImages(
  ctx: OwnedProductContext,
  orderedImageIds: string[]
): Promise<void> {
  const existing = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(eq(productImages.productId, ctx.productId));

  const existingIds = new Set(existing.map((r) => r.id));
  const requestedIds = new Set(orderedImageIds);

  if (
    existingIds.size !== requestedIds.size ||
    ![...existingIds].every((id) => requestedIds.has(id))
  ) {
    throw new ImageValidationError("قائمة ترتيب الصور غير صحيحة");
  }

  // Wrapped in a transaction, and run sequentially (not Promise.all) — the
  // underlying pg connection used by a transaction handles one query at a
  // time, and sequential awaits also mean that if one update fails partway
  // through, the transaction rolls back every update instead of leaving the
  // product with a half-applied, corrupted display order.
  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedImageIds.length; index++) {
      await tx
        .update(productImages)
        .set({ displayOrder: index })
        .where(eq(productImages.id, orderedImageIds[index]));
    }
  });
}

/**
 * Keeps the legacy/denormalized products.mainImageUrl column pointing at
 * the current primary image (or null if there are none). Several existing
 * read paths — product listing, cart, checkout, order snapshots — read this
 * column directly, so product_images stays the single source of truth while
 * this cache is refreshed on every mutation instead of migrating every
 * caller at once.
 */
async function syncMainImageUrl(productId: string): Promise<void> {
  const [primary] = await db
    .select({ imageUrl: productImages.imageUrl })
    .from(productImages)
    .where(and(eq(productImages.productId, productId), eq(productImages.isPrimary, true)))
    .limit(1);

  await db
    .update(products)
    .set({ mainImageUrl: primary?.imageUrl ?? null, updatedAt: new Date() })
    .where(eq(products.id, productId));
}
