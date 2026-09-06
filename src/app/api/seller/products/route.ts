import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, sellerProfiles, categories, subcategories, brands } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const [sellerProfile] = await db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.profileId, session.userId))
      .limit(1);

    if (!sellerProfile || sellerProfile.status !== "approved") {
      return NextResponse.json({ error: "حساب البائع غير معتمد" }, { status: 403 });
    }

    const rows = await db
      .select({
        id: products.id,
        nameAr: products.nameAr,
        nameEn: products.nameEn,
        price: products.price,
        discountPercent: products.discountPercent,
        stock: products.stock,
        condition: products.condition,
        mainImageUrl: products.mainImageUrl,
        isActive: products.isActive,
        partNumber: products.partNumber,
        createdAt: products.createdAt,
        categoryNameAr: categories.nameAr,
        subcategoryNameAr: subcategories.nameAr,
        brandNameAr: brands.nameAr,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(eq(products.sellerId, sellerProfile.id))
      .orderBy(desc(products.createdAt));

    return NextResponse.json({ products: rows });
  } catch (error) {
    console.error("Seller products GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "seller" && session.role !== "admin")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const [sellerProfile] = await db
      .select()
      .from(sellerProfiles)
      .where(eq(sellerProfiles.profileId, session.userId))
      .limit(1);

    if (!sellerProfile || sellerProfile.status !== "approved") {
      return NextResponse.json({ error: "حساب البائع غير معتمد" }, { status: 403 });
    }

    const body = await request.json();
    // Note: mainImageUrl is intentionally NOT read from the request body.
    // It is a denormalized cache of the current primary product_images row,
    // owned exclusively by the image upload/delete/set-primary pipeline
    // (see syncMainImageUrl() in src/lib/product-images.ts). Accepting it
    // here would let a request set the product's displayed image to an
    // arbitrary, unvalidated URL that never went through Supabase Storage
    // processing, and would desynchronize it from product_images.
    const {
      nameAr, nameEn, descriptionAr, descriptionEn,
      categoryId, subcategoryId, brandId, price, discountPercent,
      stock, condition, manufacturer, partNumber, oemNumber, crossReference,
      warranty,
    } = body;

    if (!nameAr || !nameEn || !categoryId || !price) {
      return NextResponse.json({ error: "البيانات الأساسية مطلوبة" }, { status: 400 });
    }

    const baseSlug = slugify(nameEn);
    let slug = `${baseSlug}-${Date.now()}`;

    const [product] = await db.insert(products).values({
      sellerId: sellerProfile.id,
      nameAr,
      nameEn,
      slug,
      descriptionAr,
      descriptionEn,
      categoryId,
      subcategoryId: subcategoryId || undefined,
      brandId: brandId || undefined,
      price: price.toString(),
      discountPercent: discountPercent ? discountPercent.toString() : "0",
      stock: stock || 0,
      condition: condition || "new",
      manufacturer,
      partNumber,
      oemNumber,
      crossReference,
      warranty,
      // mainImageUrl is left unset here (null by default); it is populated
      // once the first product image is uploaded, via syncMainImageUrl().
    }).returning();

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Seller product create error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
