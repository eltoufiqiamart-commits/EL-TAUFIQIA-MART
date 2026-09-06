import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products, sellerProfiles, brands } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

async function getOrCreateCart(profileId: string) {
  let [cart] = await db.select().from(carts).where(eq(carts.profileId, profileId)).limit(1);
  if (!cart) {
    [cart] = await db.insert(carts).values({ profileId }).returning();
  }
  return cart;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const cart = await getOrCreateCart(session.userId);

    const items = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        productId: products.id,
        productNameAr: products.nameAr,
        productNameEn: products.nameEn,
        productSlug: products.slug,
        productPrice: products.price,
        productDiscountPercent: products.discountPercent,
        productStock: products.stock,
        productImageUrl: products.mainImageUrl,
        productCondition: products.condition,
        partNumber: products.partNumber,
        sellerId: sellerProfiles.id,
        sellerStoreName: sellerProfiles.storeName,
        brandNameAr: brands.nameAr,
        brandNameEn: brands.nameEn,
        isActive: products.isActive,
        sellerStatus: sellerProfiles.status,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(sellerProfiles, eq(products.sellerId, sellerProfiles.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(eq(cartItems.cartId, cart.id));

    return NextResponse.json({ cart, items });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { productId, quantity = 1 } = await request.json();

    if (!productId || quantity < 1) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    // Validate product
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.isActive, true)))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: "الكمية المطلوبة غير متاحة" }, { status: 400 });
    }

    const cart = await getOrCreateCart(session.userId);

    // Check if already in cart
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
      .limit(1);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        return NextResponse.json({ error: "الكمية المطلوبة تتجاوز المخزون المتاح" }, { status: 400 });
      }
      await db
        .update(cartItems)
        .set({ quantity: newQty })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId,
        quantity,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart POST error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
