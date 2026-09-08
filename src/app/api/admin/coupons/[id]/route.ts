import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const b = await request.json();
    const set: Record<string, unknown> = {};
    if (b.code !== undefined) set.code = String(b.code).trim().toUpperCase();
    if (b.descriptionAr !== undefined) set.descriptionAr = b.descriptionAr?.trim() || null;
    if (b.discountType !== undefined) set.discountType = b.discountType === "fixed" ? "fixed" : "percent";
    if (b.discountValue !== undefined) {
      const v = Number(b.discountValue);
      if (!Number.isFinite(v) || v <= 0 || ((set.discountType ?? "percent") === "percent" && v > 100))
        return NextResponse.json({ error: "قيمة الخصم غير صحيحة" }, { status: 400 });
      set.discountValue = v.toFixed(2);
    }
    if (b.minOrderAmount !== undefined) set.minOrderAmount = b.minOrderAmount === "" ? "0" : Number(b.minOrderAmount).toFixed(2);
    if (b.maxUses !== undefined) set.maxUses = b.maxUses === "" || b.maxUses == null ? null : Number(b.maxUses);
    if (b.expiresAt !== undefined) set.expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;
    if (b.isActive !== undefined) set.isActive = Boolean(b.isActive);
    if (!Object.keys(set).length) return NextResponse.json({ error: "لا توجد تغييرات" }, { status: 400 });
    const [row] = await db.update(coupons).set(set).where(eq(coupons.id, id)).returning();
    if (!row) return NextResponse.json({ error: "الكوبون غير موجود" }, { status: 404 });
    return NextResponse.json({ coupon: row });
  } catch (error) {
    if (error instanceof Error && (error as { code?: string }).code === "23505") return NextResponse.json({ error: "كود الخصم مستخدم بالفعل" }, { status: 409 });
    if (error instanceof Error && (error.message === "FORBIDDEN" || error.message === "UNAUTHORIZED")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin coupon PATCH error:", error);
    return NextResponse.json({ error: "خطأ في تحديث الكوبون" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [row] = await db.update(coupons).set({ isActive: false }).where(eq(coupons.id, id)).returning({ id: coupons.id });
    if (!row) return NextResponse.json({ error: "الكوبون غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "غير مصرح" }, { status: 403 }); }
}
