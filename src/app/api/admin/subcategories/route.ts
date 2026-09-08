import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, subcategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

async function uniqueSlug(base: string) {
  const safeBase = slugify(base) || `subcategory-${Date.now()}`;
  let slug = safeBase;
  let counter = 1;
  while (true) {
    const rows = await db.select({ id: subcategories.id }).from(subcategories).where(eq(subcategories.slug, slug)).limit(1);
    if (!rows.length) return slug;
    slug = `${safeBase}-${counter++}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const categoryId = text(body.categoryId);
    const nameAr = text(body.nameAr);
    const nameEn = text(body.nameEn);
    if (!categoryId || !nameAr || !nameEn) return NextResponse.json({ error: "التصنيف والاسم بالعربي والإنجليزي مطلوبون" }, { status: 400 });

    const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).limit(1);
    if (!category) return NextResponse.json({ error: "التصنيف الأساسي غير موجود" }, { status: 400 });

    const [subcategory] = await db.insert(subcategories).values({
      categoryId, nameAr, nameEn, slug: await uniqueSlug(nameEn),
      descriptionAr: text(body.descriptionAr) || null,
      descriptionEn: text(body.descriptionEn) || null,
      imageUrl: text(body.imageUrl) || null,
      displayOrder: Number.isFinite(Number(body.displayOrder)) ? Number(body.displayOrder) : 0,
      isActive: body.isActive !== false,
    }).returning();

    return NextResponse.json({ subcategory }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin subcategory create error:", error);
    return NextResponse.json({ error: "خطأ في إنشاء التصنيف الفرعي" }, { status: 500 });
  }
}
