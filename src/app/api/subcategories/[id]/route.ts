import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products, subcategories } from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

async function uniqueSlug(base: string, currentId: string) {
  const safeBase = slugify(base) || `subcategory-${Date.now()}`;
  let slug = safeBase;
  let counter = 1;
  while (true) {
    const rows = await db.select({ id: subcategories.id }).from(subcategories).where(eq(subcategories.slug, slug));
    if (!rows.length || (rows.length === 1 && rows[0].id === currentId)) return slug;
    slug = `${safeBase}-${counter++}`;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const values: Record<string, unknown> = {};

    if (body.categoryId !== undefined) {
      const categoryId = text(body.categoryId);
      const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).limit(1);
      if (!category) return NextResponse.json({ error: "التصنيف الأساسي غير موجود" }, { status: 400 });
      values.categoryId = categoryId;
    }
    if (body.nameAr !== undefined) {
      values.nameAr = text(body.nameAr);
      if (!values.nameAr) return NextResponse.json({ error: "الاسم بالعربي مطلوب" }, { status: 400 });
    }
    if (body.nameEn !== undefined) {
      const nameEn = text(body.nameEn);
      if (!nameEn) return NextResponse.json({ error: "الاسم بالإنجليزي مطلوب" }, { status: 400 });
      values.nameEn = nameEn;
      values.slug = await uniqueSlug(nameEn, id);
    }
    if (body.descriptionAr !== undefined) values.descriptionAr = text(body.descriptionAr) || null;
    if (body.descriptionEn !== undefined) values.descriptionEn = text(body.descriptionEn) || null;
    if (body.imageUrl !== undefined) values.imageUrl = text(body.imageUrl) || null;
    if (body.displayOrder !== undefined) values.displayOrder = Number.isFinite(Number(body.displayOrder)) ? Number(body.displayOrder) : 0;
    if (body.isActive !== undefined) values.isActive = Boolean(body.isActive);
    values.updatedAt = new Date();

    const [subcategory] = await db.update(subcategories).set(values as never).where(eq(subcategories.id, id)).returning();
    if (!subcategory) return NextResponse.json({ error: "التصنيف الفرعي غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true, subcategory });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin subcategory update error:", error);
    return NextResponse.json({ error: "خطأ في تحديث التصنيف الفرعي" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [productCount] = await db.select({ count: count() }).from(products).where(eq(products.subcategoryId, id));
    if (Number(productCount?.count || 0) > 0) {
      await db.update(subcategories).set({ isActive: false, updatedAt: new Date() }).where(eq(subcategories.id, id));
      return NextResponse.json({ success: true, deactivated: true, message: "تم تعطيل التصنيف الفرعي للحفاظ على المنتجات المرتبطة به" });
    }

    const deleted = await db.delete(subcategories).where(eq(subcategories.id, id)).returning({ id: subcategories.id });
    if (!deleted.length) return NextResponse.json({ error: "التصنيف الفرعي غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true, deleted: true, message: "تم حذف التصنيف الفرعي" });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin subcategory delete error:", error);
    return NextResponse.json({ error: "تعذر حذف التصنيف الفرعي" }, { status: 500 });
  }
}
