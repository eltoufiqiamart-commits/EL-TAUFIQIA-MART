import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

function authError(error: unknown) {
  return error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { nameAr, nameEn, logoUrl, country, displayOrder, isActive } = body;
    const updates: Record<string, unknown> = {};

    if (nameAr !== undefined) updates.nameAr = String(nameAr).trim();
    if (nameEn !== undefined) {
      const cleanName = String(nameEn).trim();
      updates.nameEn = cleanName;
      updates.slug = slugify(cleanName) || `brand-${Date.now()}`;
    }
    if (logoUrl !== undefined) updates.logoUrl = logoUrl ? String(logoUrl).trim() : null;
    if (country !== undefined) updates.country = country ? String(country).trim() : null;
    if (displayOrder !== undefined) updates.displayOrder = Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    if (!Object.keys(updates).length) return NextResponse.json({ success: true });
    await db.update(brands).set(updates).where(eq(brands.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (authError(error)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin brand update error:", error);
    return NextResponse.json({ error: "خطأ في تحديث الماركة" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [usage] = await db.select({ count: count() }).from(products).where(eq(products.brandId, id));

    if (usage.count > 0) {
      await db.update(brands).set({ isActive: false }).where(eq(brands.id, id));
      return NextResponse.json({ success: true, message: "تم تعطيل الماركة لأنها مرتبطة بمنتجات" });
    }

    await db.delete(brands).where(eq(brands.id, id));
    return NextResponse.json({ success: true, message: "تم حذف الماركة" });
  } catch (error) {
    if (authError(error)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin brand delete error:", error);
    return NextResponse.json({ error: "خطأ في حذف الماركة" }, { status: 500 });
  }
}
