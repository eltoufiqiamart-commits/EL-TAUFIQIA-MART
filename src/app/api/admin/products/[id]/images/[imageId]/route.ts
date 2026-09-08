import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ImageValidationError, OwnershipError, requireAdminProductContext, deleteAdminProductImage, setPrimaryAdminProductImage } from "@/lib/product-images";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  try {
    await requireAdmin();
    const { id, imageId } = await params;
    const ctx = await requireAdminProductContext(id);
    await deleteAdminProductImage(ctx, imageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    if (error instanceof OwnershipError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof ImageValidationError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Admin product image delete error:", error);
    return NextResponse.json({ error: "خطأ في حذف الصورة" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  try {
    await requireAdmin();
    const { id, imageId } = await params;
    const ctx = await requireAdminProductContext(id);
    const body = await request.json().catch(() => ({}));
    if (body.isPrimary !== true) return NextResponse.json({ error: "لا يوجد إجراء صالح" }, { status: 400 });
    await setPrimaryAdminProductImage(ctx, imageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    if (error instanceof OwnershipError) return NextResponse.json({ error: error.message }, { status: 404 });
    if (error instanceof ImageValidationError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("Admin product image update error:", error);
    return NextResponse.json({ error: "خطأ في تحديث الصورة" }, { status: 500 });
  }
}
