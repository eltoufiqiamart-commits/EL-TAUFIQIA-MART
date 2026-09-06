import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, sellerProfiles, productImages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
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

    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.sellerId, sellerProfile.id)))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.displayOrder);

    return NextResponse.json({ product, images });
  } catch (error) {
    console.error("Seller product GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
