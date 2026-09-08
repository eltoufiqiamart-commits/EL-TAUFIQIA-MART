import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { getSession } from "@/lib/auth";

function validateCoupon(coupon: typeof coupons.$inferSelect, subtotal: number) {
  if (!coupon.isActive) return "الكوبون غير مفعل";
  if (coupon.expiresAt && coupon.expiresAt <= new Date()) return "انتهت صلاحية الكوبون";
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return "تم استنفاد عدد مرات استخدام الكوبون";
  const minOrder = Number(coupon.minOrderAmount ?? 0);
  if (subtotal < minOrder) return `الحد الأدنى لاستخدام الكوبون هو ${minOrder.toFixed(2)} جنيه`;
  return null;
}

function calculateCouponDiscount(coupon: typeof coupons.$inferSelect, subtotal: number) {
  const value = Number(coupon.discountValue);
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (coupon.discountType === "percent") return Math.min(subtotal, subtotal * value / 100);
  return Math.min(subtotal, value);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    const body = await request.json();
    const code = String(body.code ?? "").trim().toUpperCase();
    const subtotal = Number(body.subtotal);
    if (!code || !Number.isFinite(subtotal) || subtotal < 0) return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });

    const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
    if (!coupon) return NextResponse.json({ error: "كود الكوبون غير صحيح" }, { status: 400 });
    const validationError = validateCoupon(coupon, subtotal);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discount: calculateCouponDiscount(coupon, subtotal).toFixed(2),
        descriptionAr: coupon.descriptionAr,
      },
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ error: "تعذر التحقق من الكوبون" }, { status: 500 });
  }
}
