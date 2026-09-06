import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, subcategories, products } from "@/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();

    const cats = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.displayOrder), asc(categories.nameAr));

    const subs = await db
      .select()
      .from(subcategories)
      .orderBy(asc(subcategories.displayOrder), asc(subcategories.nameAr));

    const categoriesWithSubs = cats.map((cat) => ({
      ...cat,
      subcategories: subs.filter((sub) => sub.categoryId === cat.id),
    }));

    return NextResponse.json({ categories: categoriesWithSubs });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("Admin categories error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { nameAr, nameEn, descriptionAr, descriptionEn, displayOrder } = body;

    if (!nameAr || !nameEn) {
      return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    }

    const baseSlug = slugify(nameEn);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter++}`;
    }

    const [cat] = await db.insert(categories).values({
      nameAr,
      nameEn,
      slug,
      descriptionAr,
      descriptionEn,
      displayOrder: displayOrder || 0,
    }).returning();

    return NextResponse.json({ category: cat });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("Admin category create error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
