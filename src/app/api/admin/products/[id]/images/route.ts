import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productImages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { ImageValidationError, OwnershipError, requireAdminProductContext, uploadAdminProductImage, reorderAdminProductImages } from "@/lib/product-images";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await requireAdminProductContext(id);
    const images = await db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(productImages.displayOrder);
    return NextResponse.json({ images });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    if (error instanceof OwnershipError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Admin product images GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const ctx = await requireAdminProductContext(id);
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file || !(file instanceof File)) return NextResponse.json({ error: "لم يتم اختيار صورة" }, { status: 400 });
    try {
      const image = await uploadAdminProductImage(ctx, await file.arrayBuffer());
      return NextResponse.json({ image });
    } catch (error) {
      if (error instanceof ImageValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    if (error instanceof OwnershipError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Admin product image upload error:", error);
    return NextResponse.json({ error: "خطأ في رفع الصورة" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const ctx = await requireAdminProductContext(id);
    const body = await request.json().catch(() => ({}));
    if (!Array.isArray(body.order) || !body.order.every((v: unknown) => typeof v === "string")) return NextResponse.json({ error: "بيانات ترتيب غير صحيحة" }, { status: 400 });
    await reorderAdminProductImages(ctx, body.order);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    if (error instanceof OwnershipError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof ImageValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Admin product images reorder error:", error);
    return NextResponse.json({ error: "خطأ في ترتيب الصور" }, { status: 500 });
  }
}
