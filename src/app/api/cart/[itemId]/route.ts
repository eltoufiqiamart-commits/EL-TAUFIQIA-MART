import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts, cartItems, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { itemId } = await params;
    const { quantity } = await request.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: "كمية غير صالحة" }, { status: 400 });
    }

    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.profileId, session.userId))
      .limit(1);

    if (!cart) {
      return NextResponse.json({ error: "السلة غير موجودة" }, { status: 404 });
    }

    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
    }

    // Validate stock
    const [product] = await db
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (product && quantity > product.stock) {
      return NextResponse.json({ error: "الكمية تتجاوز المخزون" }, { status: 400 });
    }

    await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, itemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart PATCH error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { itemId } = await params;

    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.profileId, session.userId))
      .limit(1);

    if (!cart) {
      return NextResponse.json({ error: "السلة غير موجودة" }, { status: 404 });
    }

    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
