import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { and, eq, or, isNull, gt } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    if (!(await getSession())) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    const b = await request.json();
    const code = String(b.code ?? "").trim().toUpperCase();
    const subtotal = Number(b.subtotal);
    if (!code || !Number.isFinite(subtotal) || subtotal < 0) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    const now = new Date();
    const [c] = await db.select().from(coupons).where(and(eq(coupons.code, code), eq(coupons.isActive, true), or(isNull(coupons.expiresAt), gt(coupons.expiresAt, now)))).limit(1);
    if (!c) return NextResponse.json({ error: "كود الخصم غير صالح أو منتهي" }, { status: 400 });
    if (c.maxUses !== null && c.usedCount >= c.maxUses) return NextResponse.json({ error: "تم استنفاد استخدامات الكوبون" }, { status: 400 });
    const min = Number(c.minOrderAmount ?? 0);
    if (subtotal < min) return NextResponse.json({ error: `الحد الأدنى لاستخدام الكوبون ${min.toFixed(2)} جنيه` }, { status: 400 });
    const value = Number(c.discountValue);
    const discount = c.discountType === "fixed" ? Math.min(value, subtotal) : Math.min(subtotal, subtotal * value / 100);
    return NextResponse.json({ valid: true, code: c.code, discount: Number(discount.toFixed(2)), descriptionAr: c.descriptionAr });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: "تعذر التحقق من الكوبون" }, { status: 500 });
  }
}
