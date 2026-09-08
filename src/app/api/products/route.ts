import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages, categories, subcategories, brands, sellerProfiles, profiles } from "@/db/schema";
import { eq, and, ilike, or, gte, lte, desc, asc, inArray, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const categoryId = searchParams.get("category") || "";
    const subcategoryId = searchParams.get("subcategory") || "";
    const brandId = searchParams.get("brand") || "";
    const condition = searchParams.get("condition") || "";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const sellerId = searchParams.get("seller") || "";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 48);
    const offset = (page - 1) * limit;
    const featured = searchParams.get("featured") === "true";

    const conditions = [eq(products.isActive, true)];

    if (q) {
      conditions.push(
        or(
          ilike(products.nameAr, `%${q}%`),
          ilike(products.nameEn, `%${q}%`),
          ilike(products.partNumber, `%${q}%`),
          ilike(products.oemNumber, `%${q}%`),
          ilike(products.crossReference, `%${q}%`),
          ilike(products.manufacturer, `%${q}%`)
        )!
      );
    }

    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (subcategoryId) conditions.push(eq(products.subcategoryId, subcategoryId));
    if (brandId) conditions.push(eq(products.brandId, brandId));
    if (condition) conditions.push(eq(products.condition, condition as "new" | "used" | "original" | "aftermarket" | "oem"));
    if (minPrice) conditions.push(gte(products.price, minPrice));
    if (maxPrice) conditions.push(lte(products.price, maxPrice));
    if (sellerId) conditions.push(eq(products.sellerId, sellerId));
    if (featured) conditions.push(eq(products.isFeatured, true));

    // Only show products from approved sellers
    const approvedSellers = await db
      .select({ id: sellerProfiles.id })
      .from(sellerProfiles)
      .where(eq(sellerProfiles.status, "approved"));
    
    if (approvedSellers.length > 0) {
      conditions.push(inArray(products.sellerId, approvedSellers.map(s => s.id)));
    } else if (!sellerId) {
      // No approved sellers, return empty
      return NextResponse.json({ products: [], total: 0, page, limit });
    }

    let orderBy;
    switch (sort) {
      case "price_asc":
        orderBy = asc(products.price);
        break;
      case "price_desc":
        orderBy = desc(products.price);
        break;
      case "popular":
        orderBy = desc(products.viewCount);
        break;
      default:
        orderBy = desc(products.createdAt);
    }

    const whereClause = and(...conditions);

    const [countResult, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause),
      db
        .select({
          id: products.id,
          nameAr: products.nameAr,
          nameEn: products.nameEn,
          slug: products.slug,
          price: products.price,
          discountPercent: products.discountPercent,
          stock: products.stock,
          condition: products.condition,
          mainImageUrl: products.mainImageUrl,
          isFeatured: products.isFeatured,
          partNumber: products.partNumber,
          warranty: products.warranty,
          categoryId: products.categoryId,
          sellerId: products.sellerId,
          createdAt: products.createdAt,
          categoryNameAr: categories.nameAr,
          categoryNameEn: categories.nameEn,
          brandNameAr: brands.nameAr,
          brandNameEn: brands.nameEn,
          sellerStoreName: sellerProfiles.storeName,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .leftJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({ products: rows, total, page, limit });
  } catch (error) {
    console.error("Products error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
