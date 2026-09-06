import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, sellerProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify ownership
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, id), eq(products.sellerId, sellerProfile.id)))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    const body = await request.json();
    // mainImageUrl is intentionally not accepted here — see the matching
    // note in src/app/api/seller/products/route.ts. It is a denormalized
    // cache owned exclusively by the image pipeline (syncMainImageUrl() in
    // src/lib/product-images.ts); accepting client-supplied values for it
    // would let it drift out of sync with product_images and would allow
    // setting the display image to an unvalidated arbitrary URL.
    const {
      nameAr, nameEn, descriptionAr, descriptionEn,
      categoryId, subcategoryId, brandId, price, discountPercent,
      stock, condition, manufacturer, partNumber, oemNumber, crossReference,
      warranty, isActive,
    } = body;

    await db.update(products).set({
      ...(nameAr !== undefined && { nameAr }),
      ...(nameEn !== undefined && { nameEn }),
      ...(descriptionAr !== undefined && { descriptionAr }),
      ...(descriptionEn !== undefined && { descriptionEn }),
      ...(categoryId !== undefined && { categoryId }),
      ...(subcategoryId !== undefined && { subcategoryId }),
      ...(brandId !== undefined && { brandId }),
      ...(price !== undefined && { price: price.toString() }),
      ...(discountPercent !== undefined && { discountPercent: discountPercent.toString() }),
      ...(stock !== undefined && { stock }),
      ...(condition !== undefined && { condition }),
      ...(manufacturer !== undefined && { manufacturer }),
      ...(partNumber !== undefined && { partNumber }),
      ...(oemNumber !== undefined && { oemNumber }),
      ...(crossReference !== undefined && { crossReference }),
      ...(warranty !== undefined && { warranty }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    }).where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seller product update error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!sellerProfile) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { id } = await params;

    await db.update(products).set({ isActive: false }).where(
      and(eq(products.id, id), eq(products.sellerId, sellerProfile.id))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seller product delete error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
