import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

function authError(error: unknown) {
  return error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN");
}

async function uniqueSlug(nameEn: string, excludeId?: string) {
  const base = slugify(nameEn) || `brand-${Date.now()}`;
  let slug = base;
  let counter = 1;
  while (true) {
    const rows = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, slug)).limit(1);
    if (!rows.length || rows[0].id === excludeId) return slug;
    slug = `${base}-${counter++}`;
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const active = searchParams.get("active");
    const conditions = [];
    if (q) {
      conditions.push(or(ilike(brands.nameAr, `%${q}%`), ilike(brands.nameEn, `%${q}%`), ilike(brands.country, `%${q}%`))!);
    }
    if (active === "true") conditions.push(eq(brands.isActive, true));
    if (active === "false") conditions.push(eq(brands.isActive, false));

    const rows = await db.select().from(brands)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(brands.displayOrder), asc(brands.nameEn));

    return NextResponse.json({ brands: rows });
  } catch (error) {
    if (authError(error)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin brands GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { nameAr, nameEn, logoUrl, country, displayOrder, isActive } = body;
    if (!String(nameAr || "").trim() || !String(nameEn || "").trim()) {
      return NextResponse.json({ error: "الاسم بالعربية والإنجليزية مطلوب" }, { status: 400 });
    }

    const slug = await uniqueSlug(String(nameEn).trim());
    const [brand] = await db.insert(brands).values({
      nameAr: String(nameAr).trim(),
      nameEn: String(nameEn).trim(),
      slug,
      logoUrl: logoUrl ? String(logoUrl).trim() : null,
      country: country ? String(country).trim() : null,
      displayOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
      isActive: isActive !== false,
    }).returning();

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    if (authError(error)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin brand create error:", error);
    return NextResponse.json({ error: "خطأ في إضافة الماركة" }, { status: 500 });
  }
}
