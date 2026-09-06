import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subcategories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { categoryId, nameAr, nameEn, descriptionAr, displayOrder } = body;

    if (!categoryId || !nameAr || !nameEn) {
      return NextResponse.json({ error: "البيانات مطلوبة" }, { status: 400 });
    }

    const baseSlug = slugify(nameEn);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await db.select({ id: subcategories.id }).from(subcategories).where(eq(subcategories.slug, slug)).limit(1);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const [sub] = await db.insert(subcategories).values({
      categoryId,
      nameAr,
      nameEn,
      slug,
      descriptionAr,
      displayOrder: displayOrder || 0,
    }).returning();

    return NextResponse.json({ subcategory: sub });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("Admin subcategory create error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
