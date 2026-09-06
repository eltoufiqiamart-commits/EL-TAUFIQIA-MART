import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  ImageValidationError,
  OwnershipError,
  deleteProductImage,
  requireOwnedProduct,
  setPrimaryProductImage,
} from "@/lib/product-images";

async function authorizeAndOwn(userId: string, productId: string) {
  return requireOwnedProduct(userId, productId);
}

// Only sellers may mutate product images (see the matching note in
// ../route.ts). Admins are excluded because there is no admin-owned seller
// profile and no separate admin image-management path in this application —
// letting "admin" through the role check here would only ever reach
// requireOwnedProduct() and fail with a misleading ownership error, or
// (if that check were ever weakened) would silently let an admin bypass
// per-seller isolation. If admin image moderation is required in the
// future, add an explicit, separate authorization branch here.

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (session.role !== "seller") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { id: productId, imageId } = await params;

    let ctx;
    try {
      ctx = await authorizeAndOwn(session.userId, productId);
    } catch (err) {
      if (err instanceof OwnershipError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    try {
      await deleteProductImage(ctx, imageId);
    } catch (err) {
      if (err instanceof ImageValidationError) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      throw err;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seller product image delete error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    if (session.role !== "seller") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { id: productId, imageId } = await params;

    let ctx;
    try {
      ctx = await authorizeAndOwn(session.userId, productId);
    } catch (err) {
      if (err instanceof OwnershipError) {
        return NextResponse.json({ error: err.message }, { status: 403 });
      }
      throw err;
    }

    const body = await request.json().catch(() => ({}));

    if (body.isPrimary === true) {
      try {
        await setPrimaryProductImage(ctx, imageId);
      } catch (err) {
        if (err instanceof ImageValidationError) {
          return NextResponse.json({ error: err.message }, { status: 404 });
        }
        throw err;
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "لا يوجد إجراء صالح" }, { status: 400 });
  } catch (error) {
    console.error("Seller product image update error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
