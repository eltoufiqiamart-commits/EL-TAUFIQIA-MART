import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, subcategories, products } from "@/db/schema";
import { and, asc, count, eq, ilike, or, isNotNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const order = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

async function uniqueSlug(base: string, currentId?: string) {
  const safeBase = slugify(base) || `category-${Date.now()}`;
  let slug = safeBase;
  let counter = 1;
  while (true) {
    const rows = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(2);
    if (rows.length === 0 || (currentId && rows.length === 1 && rows[0].id === currentId)) return slug;
    slug = `${safeBase}-${counter++}`;
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = text(searchParams.get("q"));
    const active = searchParams.get("active");

    const conditions = [];
    if (q) {
      conditions.push(or(ilike(categories.nameAr, `%${q}%`), ilike(categories.nameEn, `%${q}%`), ilike(categories.slug, `%${q}%`))!);
    }
    if (active === "true") conditions.push(eq(categories.isActive, true));
    if (active === "false") conditions.push(eq(categories.isActive, false));

    const cats = await db.select().from(categories)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(categories.displayOrder), asc(categories.nameAr));

    const subs = await db.select().from(subcategories).orderBy(asc(subcategories.displayOrder), asc(subcategories.nameAr));

    const productCounts = await db.select({ categoryId: products.categoryId, count: count() }).from(products).groupBy(products.categoryId);
    const subProductCounts = await db.select({ subcategoryId: products.subcategoryId, count: count() }).from(products).where(isNotNull(products.subcategoryId)).groupBy(products.subcategoryId);

    const categoryCountMap = new Map(productCounts.map((row) => [row.categoryId, Number(row.count)]));
    const subProductCountMap = new Map(subProductCounts.map((row) => [row.subcategoryId as string, Number(row.count)]));

    const result = cats.map((cat) => ({
      ...cat,
      productCount: categoryCountMap.get(cat.id) || 0,
      subcategories: subs.filter((sub) => sub.categoryId === cat.id).map((sub) => ({
        ...sub,
        productCount: subProductCountMap.get(sub.id) || 0,
      })),
    }));

    return NextResponse.json({ categories: result });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin categories error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const nameAr = text(body.nameAr);
    const nameEn = text(body.nameEn);
    if (!nameAr || !nameEn) return NextResponse.json({ error: "الاسم بالعربي والإنجليزي مطلوب" }, { status: 400 });

    const slug = await uniqueSlug(nameEn);
    const [category] = await db.insert(categories).values({
      nameAr, nameEn, slug,
      descriptionAr: text(body.descriptionAr) || null,
      descriptionEn: text(body.descriptionEn) || null,
      imageUrl: text(body.imageUrl) || null,
      displayOrder: order(body.displayOrder),
      isActive: body.isActive !== false,
    }).returning();

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin category create error:", error);
    return NextResponse.json({ error: "خطأ في إنشاء التصنيف" }, { status: 500 });
  }
}

