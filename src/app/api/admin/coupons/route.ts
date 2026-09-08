import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return NextResponse.json({ coupons: rows });
  } catch (error) {
    if (error instanceof Error && (error.message === "FORBIDDEN" || error.message === "UNAUTHORIZED"))
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin coupons GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const b = await request.json();
    const code = String(b.code ?? "").trim().toUpperCase();
    const discountType = b.discountType === "fixed" ? "fixed" : "percent";
    const discountValue = Number(b.discountValue);
    const minOrderAmount = b.minOrderAmount === "" || b.minOrderAmount == null ? 0 : Number(b.minOrderAmount);
    const maxUses = b.maxUses === "" || b.maxUses == null ? null : Number(b.maxUses);
    const expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;

    if (!code || code.length > 50) return NextResponse.json({ error: "كود الخصم مطلوب" }, { status: 400 });
    if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "percent" && discountValue > 100))
      return NextResponse.json({ error: "قيمة الخصم غير صحيحة" }, { status: 400 });
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0)
      return NextResponse.json({ error: "الحد الأدنى للطلب غير صحيح" }, { status: 400 });
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1))
      return NextResponse.json({ error: "عدد الاستخدامات غير صحيح" }, { status: 400 });
    if (expiresAt && Number.isNaN(expiresAt.getTime()))
      return NextResponse.json({ error: "تاريخ الانتهاء غير صحيح" }, { status: 400 });

    const [row] = await db.insert(coupons).values({
      code, descriptionAr: b.descriptionAr?.trim() || null, discountType,
      discountValue: discountValue.toFixed(2), minOrderAmount: minOrderAmount.toFixed(2),
      maxUses, expiresAt, isActive: b.isActive !== false,
    }).returning();
    return NextResponse.json({ coupon: row });
  } catch (error) {
    if (error instanceof Error && (error as { code?: string }).code === "23505")
      return NextResponse.json({ error: "كود الخصم مستخدم بالفعل" }, { status: 409 });
    if (error instanceof Error && (error.message === "FORBIDDEN" || error.message === "UNAUTHORIZED"))
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin coupon POST error:", error);
    return NextResponse.json({ error: "خطأ في إنشاء الكوبون" }, { status: 500 });
  }
}
