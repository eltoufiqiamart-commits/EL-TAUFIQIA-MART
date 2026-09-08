import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shippingMethods, orders } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

function forbidden(error: unknown) {
  return error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const patch: Record<string, unknown> = {};
    if (body.nameAr !== undefined) patch.nameAr = String(body.nameAr).trim();
    if (body.nameEn !== undefined) patch.nameEn = String(body.nameEn).trim();
    if (body.provider !== undefined) patch.provider = body.provider == null ? null : String(body.provider).trim() || null;
    if (body.fee !== undefined) {
      const fee = Number(body.fee);
      if (!Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: "سعر الشحن غير صالح" }, { status: 400 });
      patch.fee = fee.toFixed(2);
    }
    if (body.estimatedDays !== undefined) {
      const days = body.estimatedDays === "" || body.estimatedDays == null ? null : Number(body.estimatedDays);
      if (days !== null && (!Number.isInteger(days) || days < 0)) return NextResponse.json({ error: "عدد الأيام غير صالح" }, { status: 400 });
      patch.estimatedDays = days;
    }
    if (body.displayOrder !== undefined) {
      const order = Number(body.displayOrder);
      if (!Number.isInteger(order)) return NextResponse.json({ error: "الترتيب غير صالح" }, { status: 400 });
      patch.displayOrder = order;
    }
    if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);

    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "لا توجد تغييرات" }, { status: 400 });
    const [method] = await db.update(shippingMethods).set(patch as never).where(eq(shippingMethods.id, id)).returning();
    if (!method) return NextResponse.json({ error: "طريقة الشحن غير موجودة" }, { status: 404 });
    return NextResponse.json({ method, success: true });
  } catch (error) {
    if (forbidden(error)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin shipping method update error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [used] = await db.select({ count: count() }).from(orders).where(eq(orders.shippingMethodId, id));
    if (used.count > 0) {
      await db.update(shippingMethods).set({ isActive: false }).where(eq(shippingMethods.id, id));
      return NextResponse.json({ success: true, message: "تم تعطيل طريقة الشحن لأنها مستخدمة في طلبات سابقة" });
    }
    await db.delete(shippingMethods).where(eq(shippingMethods.id, id));
    return NextResponse.json({ success: true, message: "تم حذف طريقة الشحن" });
  } catch (error) {
    if (forbidden(error)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin shipping method delete error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
