import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shippingMethods } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

function forbidden(error: unknown) {
  return error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN");
}

export async function GET() {
  try {
    await requireAdmin();
    const methods = await db.select().from(shippingMethods).orderBy(asc(shippingMethods.displayOrder), asc(shippingMethods.nameAr));
    return NextResponse.json({ methods });
  } catch (error) {
    if (forbidden(error)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin shipping methods GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const nameAr = String(body.nameAr ?? "").trim();
    const nameEn = String(body.nameEn ?? "").trim();
    const provider = body.provider == null ? null : String(body.provider).trim() || null;
    const fee = Number(body.fee ?? 0);
    const estimatedDays = body.estimatedDays === "" || body.estimatedDays == null ? null : Number(body.estimatedDays);
    const displayOrder = Number(body.displayOrder ?? 0);
    const isActive = body.isActive !== false;

    if (!nameAr || !nameEn) return NextResponse.json({ error: "اسم طريقة الشحن مطلوب" }, { status: 400 });
    if (!Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: "سعر الشحن غير صالح" }, { status: 400 });
    if (estimatedDays !== null && (!Number.isInteger(estimatedDays) || estimatedDays < 0)) return NextResponse.json({ error: "عدد الأيام غير صالح" }, { status: 400 });
    if (!Number.isInteger(displayOrder)) return NextResponse.json({ error: "الترتيب غير صالح" }, { status: 400 });

    const [method] = await db.insert(shippingMethods).values({
      nameAr, nameEn, provider, fee: fee.toFixed(2), estimatedDays, displayOrder, isActive,
    }).returning();
    return NextResponse.json({ method });
  } catch (error) {
    if (forbidden(error)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin shipping method create error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
