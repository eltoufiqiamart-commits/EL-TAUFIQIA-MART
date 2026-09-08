import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories, subcategories, brands } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const active = searchParams.get("active");
    const conditions = [];
    if (q) conditions.push(or(ilike(products.nameAr, `%${q}%`), ilike(products.nameEn, `%${q}%`), ilike(products.partNumber, `%${q}%`), ilike(products.oemNumber, `%${q}%`))!);
    if (active === "true") conditions.push(eq(products.isActive, true));
    if (active === "false") conditions.push(eq(products.isActive, false));
    const where = conditions.length ? and(...conditions) : undefined;
    const rows = await db.select({
      id: products.id, nameAr: products.nameAr, nameEn: products.nameEn, slug: products.slug,
      price: products.price, discountPercent: products.discountPercent, stock: products.stock,
      condition: products.condition, mainImageUrl: products.mainImageUrl, isActive: products.isActive,
      isFeatured: products.isFeatured, partNumber: products.partNumber, createdAt: products.createdAt,
      categoryId: products.categoryId, subcategoryId: products.subcategoryId, brandId: products.brandId,
      categoryNameAr: categories.nameAr, subcategoryNameAr: subcategories.nameAr, brandNameAr: brands.nameAr,
    }).from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(where).orderBy(desc(products.createdAt));
    return NextResponse.json({ products: rows });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin products GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { nameAr, nameEn, descriptionAr, descriptionEn, categoryId, subcategoryId, brandId, price, discountPercent, stock, condition, manufacturer, partNumber, oemNumber, crossReference, warranty, weight, supplierName, supplierPhone, supplierAddress, supplierNotes, isActive, isFeatured } = body;
    if (!nameAr || !nameEn || !categoryId || price === undefined || price === "") return NextResponse.json({ error: "البيانات الأساسية مطلوبة" }, { status: 400 });
    const baseSlug = slugify(nameEn) || `product-${Date.now()}`;
    const slug = `${baseSlug}-${Date.now()}`;
    const [product] = await db.insert(products).values({
      sellerId: null,
      nameAr, nameEn, slug, descriptionAr: descriptionAr || null, descriptionEn: descriptionEn || null,
      categoryId, subcategoryId: subcategoryId || null, brandId: brandId || null, price: String(price),
      discountPercent: discountPercent === "" || discountPercent == null ? "0" : String(discountPercent),
      stock: Number(stock) || 0, condition: condition || "new", manufacturer: manufacturer || null,
      partNumber: partNumber || null, oemNumber: oemNumber || null, crossReference: crossReference || null,
      warranty: warranty || null, weight: weight === "" || weight == null ? null : String(weight),
      supplierName: supplierName || null, supplierPhone: supplierPhone || null, supplierAddress: supplierAddress || null, supplierNotes: supplierNotes || null,
      isActive: isActive !== false, isFeatured: Boolean(isFeatured),
    }).returning();
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin product create error:", error);
    return NextResponse.json({ error: "خطأ في إنشاء المنتج" }, { status: 500 });
  }
}
