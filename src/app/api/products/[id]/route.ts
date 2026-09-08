import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages, categories, subcategories, brands, sellerProfiles, vehicleFitments, vehicleMakes, vehicleModels } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [product] = await db
      .select({
        id: products.id,
        nameAr: products.nameAr,
        nameEn: products.nameEn,
        slug: products.slug,
        descriptionAr: products.descriptionAr,
        descriptionEn: products.descriptionEn,
        price: products.price,
        discountPercent: products.discountPercent,
        stock: products.stock,
        condition: products.condition,
        manufacturer: products.manufacturer,
        partNumber: products.partNumber,
        oemNumber: products.oemNumber,
        crossReference: products.crossReference,
        warranty: products.warranty,
        mainImageUrl: products.mainImageUrl,
        isActive: products.isActive,
        isFeatured: products.isFeatured,
        sellerId: products.sellerId,
        categoryId: products.categoryId,
        subcategoryId: products.subcategoryId,
        brandId: products.brandId,
        createdAt: products.createdAt,
        categoryNameAr: categories.nameAr,
        categoryNameEn: categories.nameEn,
        subcategoryNameAr: subcategories.nameAr,
        subcategoryNameEn: subcategories.nameEn,
        brandNameAr: brands.nameAr,
        brandNameEn: brands.nameEn,
        sellerStoreName: sellerProfiles.storeName,
        sellerStoreNameAr: sellerProfiles.storeNameAr,
        sellerPhone: sellerProfiles.phone,
        sellerWhatsapp: sellerProfiles.whatsapp,
        sellerStatus: sellerProfiles.status,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.id))
      .where(and(eq(products.id, id), eq(products.isActive, true)))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    if (product.sellerStatus !== "approved") {
      return NextResponse.json({ error: "المنتج غير متاح" }, { status: 404 });
    }

    // Increment view count
    await db
      .update(products)
      .set({ viewCount: sql`${products.viewCount} + 1` })
      .where(eq(products.id, id));

    // Get images
    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.displayOrder);

    // Get fitments
    const fitments = await db
      .select({
        id: vehicleFitments.id,
        makeNameAr: vehicleMakes.nameAr,
        makeNameEn: vehicleMakes.nameEn,
        modelNameAr: vehicleModels.nameAr,
        modelNameEn: vehicleModels.nameEn,
        yearFrom: vehicleFitments.yearFrom,
        yearTo: vehicleFitments.yearTo,
        notes: vehicleFitments.notes,
      })
      .from(vehicleFitments)
      .leftJoin(vehicleMakes, eq(vehicleFitments.makeId, vehicleMakes.id))
      .leftJoin(vehicleModels, eq(vehicleFitments.modelId, vehicleModels.id))
      .where(eq(vehicleFitments.productId, id));

    return NextResponse.json({ product, images, fitments });
  } catch (error) {
    console.error("Product detail error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
