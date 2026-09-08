import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products, subcategories } from "@/db/schema";
import { and, count, eq, ilike } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

async function uniqueSlug(base: string, currentId: string) {
  const safeBase = slugify(base) || `category-${Date.now()}`;
  let slug = safeBase;
  let counter = 1;
  while (true) {
    const rows = await db.select({ id: categories.id }).from(categories).where(and(eq(categories.slug, slug),));
    if (rows.length === 0 || (rows.length === 1 && rows[0].id === currentId)) return slug;
    slug = `${safeBase}-${counter++}`;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const values: Record<string, unknown> = {};

    if (body.nameAr !== undefined) values.nameAr = text(body.nameAr);
    if (body.nameEn !== undefined) {
      const nameEn = text(body.nameEn);
      if (!nameEn) return NextResponse.json({ error: "الاسم بالإنجليزي مطلوب" }, { status: 400 });
      values.nameEn = nameEn;
      values.slug = await uniqueSlug(nameEn, id);
    }
    if (body.nameAr !== undefined && !values.nameAr) return NextResponse.json({ error: "الاسم بالعربي مطلوب" }, { status: 400 });
    if (body.descriptionAr !== undefined) values.descriptionAr = text(body.descriptionAr) || null;
    if (body.descriptionEn !== undefined) values.descriptionEn = text(body.descriptionEn) || null;
    if (body.imageUrl !== undefined) values.imageUrl = text(body.imageUrl) || null;
    if (body.displayOrder !== undefined) values.displayOrder = Number.isFinite(Number(body.displayOrder)) ? Number(body.displayOrder) : 0;
    if (body.isActive !== undefined) values.isActive = Boolean(body.isActive);
    values.updatedAt = new Date();

    const [category] = await db.update(categories).set(values as never).where(eq(categories.id, id)).returning();
    if (!category) return NextResponse.json({ error: "التصنيف غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true, category });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin category update error:", error);
    return NextResponse.json({ error: "خطأ في تحديث التصنيف" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [productCount] = await db.select({ count: count() }).from(products).where(eq(products.categoryId, id));
    const [subCount] = await db.select({ count: count() }).from(subcategories).where(eq(subcategories.categoryId, id));

    if (Number(productCount?.count || 0) > 0 || Number(subCount?.count || 0) > 0) {
      await db.update(categories).set({ isActive: false, updatedAt: new Date() }).where(eq(categories.id, id));
      return NextResponse.json({ success: true, deactivated: true, message: "تم تعطيل التصنيف للحفاظ على المنتجات والتصنيفات الفرعية المرتبطة به" });
    }

    const deleted = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
    if (!deleted.length) return NextResponse.json({ error: "التصنيف غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true, deleted: true, message: "تم حذف التصنيف" });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin category delete error:", error);
    return NextResponse.json({ error: "تعذر حذف التصنيف" }, { status: 500 });
  }
}
