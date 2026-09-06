import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productImages } from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  ImageValidationError,
  OwnershipError,
  requireOwnedProduct,
  reorderProductImages,
  uploadProductImage,
} from "@/lib/product-images";

// Body-size limit for this route specifically (multipart upload). Keep in
// sync with MAX_UPLOAD_BYTES in src/lib/product-images.ts.
export const runtime = "nodejs";

// Only sellers may manage product images, scoped to products they own via
// requireOwnedProduct(). Admins are intentionally excluded here: the admin
// role has no seller profile of its own, so it can never satisfy
// requireOwnedProduct()'s ownership check, and there is no admin-specific
// product/image management flow elsewhere in this application. Rather than
// let admin requests fall through to a confusing "product not found / not
// yours" ownership error, we reject them explicitly at the role gate. If
// admin image management is ever required, add a dedicated, explicit admin
// branch here (e.g. requireAdmin() + a lookup that doesn't rely on seller
// ownership) — do not restore "admin" to this check without one, and do not
// fabricate a seller profile for admins.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "seller") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { id } = await params;

    try {
      await requireOwnedProduct(session.userId, id);
    } catch (err) {
      if (err instanceof OwnershipError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.displayOrder);

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Seller product images GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    // 2. Authorization (seller role only — see note above GET()) + 3.
    // Ownership of the product — both enforced together, server-side, from
    // the session's own userId. The seller/product IDs used for the storage
    // path come from this lookup, never from the request body.
    if (session.role !== "seller") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { id: productId } = await params;

    let ctx;
    try {
      ctx = await requireOwnedProduct(session.userId, productId);
    } catch (err) {
      if (err instanceof OwnershipError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    // 4. File validation happens inside uploadProductImage (real
    // content-based decoding via sharp, not the browser-supplied MIME type).
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "لم يتم اختيار صورة" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();

    try {
      const image = await uploadProductImage(ctx, bytes);
      return NextResponse.json({ image });
    } catch (err) {
      if (err instanceof ImageValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  } catch (error) {
    console.error("Seller product image upload error:", error);
    return NextResponse.json({ error: "خطأ في رفع الصورة" }, { status: 500 });
  }
}

// Reorders all of a product's images in one call. Body: { order: string[] }
// — the full list of that product's image IDs in the desired order.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (session.role !== "seller") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { id: productId } = await params;

    let ctx;
    try {
      ctx = await requireOwnedProduct(session.userId, productId);
    } catch (err) {
      if (err instanceof OwnershipError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    const body = await request.json().catch(() => ({}));
    const order = body.order;

    if (!Array.isArray(order) || !order.every((v) => typeof v === "string")) {
      return NextResponse.json({ error: "بيانات ترتيب غير صحيحة" }, { status: 400 });
    }

    try {
      await reorderProductImages(ctx, order);
    } catch (err) {
      if (err instanceof ImageValidationError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seller product images reorder error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
