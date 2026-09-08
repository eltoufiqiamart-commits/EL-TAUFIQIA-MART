import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  carts, cartItems, products, orders, orderItems,
  orderStatusHistory, payments, shipping, shippingMethods
} from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { generateOrderNumber, applyPrepaidDiscount, calculateDiscountedPrice } from "@/lib/utils";
import { z } from "zod";

const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.string().email().optional(),
  deliveryAddress: z.string().min(5),
  deliveryCity: z.string().optional(),
  deliveryGovernorate: z.string().optional(),
  vehicleInfo: z.record(z.string(), z.unknown()).optional(),
  paymentMethod: z.enum(["cash_on_delivery", "instapay", "vodafone_cash", "fawry", "card", "bank_transfer"] as const),
  shippingMethodId: z.string().optional(),
  customerNotes: z.string().optional(),
  couponCode: z.string().optional(),
  // Generated once by the client per checkout attempt (e.g. crypto.randomUUID())
  // and resent unchanged on retry so we never create duplicate orders.
  idempotencyKey: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Idempotency check: if this customer already submitted this exact
    // checkout attempt (double-click, browser retry, network retry), return
    // the order that was already created instead of creating another one.
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.profileId, session.userId), eq(orders.idempotencyKey, data.idempotencyKey)))
      .limit(1);

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        order: {
          id: existingOrder.id,
          orderNumber: existingOrder.orderNumber,
          total: existingOrder.total,
          status: existingOrder.status,
        },
      });
    }

    // Resolve shipping method (if any) before entering the transaction — this
    // is read-only reference data.
    let shippingFee = 0;
    let shippingProvider: string | null = null;
    let resolvedShippingMethodId: string | null = null;
    if (data.shippingMethodId) {
      const [sm] = await db
        .select()
        .from(shippingMethods)
        .where(and(eq(shippingMethods.id, data.shippingMethodId), eq(shippingMethods.isActive, true)))
        .limit(1);
      if (!sm) return NextResponse.json({ error: "طريقة الشحن المختارة غير متاحة" }, { status: 400 });
      shippingFee = parseFloat(sm.fee as string);
      shippingProvider = sm.provider ?? null;
      resolvedShippingMethodId = sm.id;
    }

    // Everything below must succeed together or not at all: order, order
    // items, seller orders, stock decrements, status history, payment and
    // shipping records, and clearing the cart.
    const result = await db.transaction(async (tx) => {
      const [cart] = await tx
        .select()
        .from(carts)
        .where(eq(carts.profileId, session.userId))
        .limit(1);

      if (!cart) {
        return { error: "السلة فارغة" as const };
      }

      const items = await tx
        .select({
          cartItemId: cartItems.id,
          quantity: cartItems.quantity,
          productId: products.id,
          nameAr: products.nameAr,
          nameEn: products.nameEn,
          price: products.price,
          discountPercent: products.discountPercent,
          stock: products.stock,
          isActive: products.isActive,
          mainImageUrl: products.mainImageUrl,
          partNumber: products.partNumber,
        })
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.cartId, cart.id))
        .for("update"); // lock the underlying product/cart rows for this transaction

      if (items.length === 0) {
        return { error: "السلة فارغة" as const };
      }

      for (const item of items) {
        if (!item.productId || !item.isActive) {
          return { error: `المنتج "${item.nameAr ?? ""}" غير متاح حالياً` as const };
        }
        const stockVal = item.stock ?? 0;
        if (stockVal < item.quantity) {
          return { error: `الكمية المطلوبة من "${item.nameAr}" غير متاحة في المخزون` as const };
        }
      }

      // Server-side price calculation — the browser's numbers are never trusted.
      let subtotal = 0;
      for (const item of items) {
        const unitPrice = calculateDiscountedPrice(
          parseFloat(item.price as string),
          item.discountPercent ? parseFloat(item.discountPercent as string) : 0
        );
        subtotal += unitPrice * item.quantity;
      }

      let couponDiscount = 0;
      let normalizedCouponCode: string | null = null;
      if (data.couponCode?.trim()) {
        normalizedCouponCode = data.couponCode.trim().toUpperCase();
        const [coupon] = await tx
          .select()
          .from(coupons)
          .where(eq(coupons.code, normalizedCouponCode))
          .for("update")
          .limit(1);
        if (!coupon) return { error: "كود الكوبون غير صحيح" as const };
        if (!coupon.isActive) return { error: "الكوبون غير مفعل" as const };
        if (coupon.expiresAt && coupon.expiresAt <= new Date()) return { error: "انتهت صلاحية الكوبون" as const };
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return { error: "تم استنفاد عدد مرات استخدام الكوبون" as const };
        const minOrderAmount = Number(coupon.minOrderAmount ?? 0);
        if (subtotal < minOrderAmount) return { error: `الحد الأدنى لاستخدام الكوبون هو ${minOrderAmount.toFixed(2)} جنيه` as const };
        const value = Number(coupon.discountValue);
        if (!Number.isFinite(value) || value <= 0) return { error: "قيمة الكوبون غير صالحة" as const };
        couponDiscount = coupon.discountType === "percent"
          ? Math.min(subtotal, subtotal * value / 100)
          : Math.min(subtotal, value);
        await tx.update(coupons).set({ usedCount: coupon.usedCount + 1 }).where(eq(coupons.id, coupon.id));
      }

      const prepaidBase = Math.max(0, subtotal - couponDiscount);
      const prepaidDiscount = data.paymentMethod !== "cash_on_delivery"
        ? applyPrepaidDiscount(prepaidBase).discount
        : 0;
      const discountAmount = couponDiscount + prepaidDiscount;
      const total = Math.max(0, subtotal - couponDiscount - prepaidDiscount) + shippingFee;
      const orderNumber = generateOrderNumber();

      const [order] = await tx.insert(orders).values({
        orderNumber,
        idempotencyKey: data.idempotencyKey,
        profileId: session.userId,
        status: "new",
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        deliveryAddress: data.deliveryAddress,
        deliveryCity: data.deliveryCity,
        deliveryGovernorate: data.deliveryGovernorate,
        shippingMethodId: resolvedShippingMethodId,
        vehicleInfo: data.vehicleInfo || null,
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        total: total.toFixed(2),
        paymentMethod: data.paymentMethod,
        paymentStatus: "pending",
        prepaidDiscountApplied: data.paymentMethod !== "cash_on_delivery",
        customerNotes: data.customerNotes,
        couponCode: normalizedCouponCode,
        couponDiscount: couponDiscount.toFixed(2),
      }).returning();

      for (const item of items) {
        const unitPrice = calculateDiscountedPrice(
          parseFloat(item.price as string),
          item.discountPercent ? parseFloat(item.discountPercent as string) : 0
        );
        const lineTotal = unitPrice * item.quantity;

        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId ?? undefined,
          productNameAr: item.nameAr ?? "منتج",
          productNameEn: item.nameEn ?? "Product",
          productImageUrl: item.mainImageUrl ?? undefined,
          partNumber: item.partNumber ?? undefined,
          unitPrice: unitPrice.toFixed(2),
          discountPercent: item.discountPercent ?? "0",
          quantity: item.quantity,
          lineTotal: lineTotal.toFixed(2),
        });

        // Race-safe stock decrement: only succeeds if enough stock is still
        // available at the moment of the write (belt-and-braces on top of the
        // row lock acquired above), preventing overselling under concurrent
        // checkouts.
        const updateResult = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(and(eq(products.id, item.productId!), sql`${products.stock} >= ${item.quantity}`))
          .returning({ id: products.id });

        if (updateResult.length === 0) {
          // Someone else grabbed the stock between our check and this write —
          // abort the whole order.
          return { error: `الكمية المطلوبة من "${item.nameAr}" لم تعد متاحة` as const };
        }
      }



      await tx.insert(orderStatusHistory).values({
        orderId: order.id,
        status: "new",
        notes: "تم إنشاء الطلب",
        actorId: session.userId,
        actorRole: "customer",
      });

      await tx.insert(payments).values({
        orderId: order.id,
        method: data.paymentMethod,
        status: "pending",
        amount: total.toFixed(2),
      });

      await tx.insert(shipping).values({
        orderId: order.id,
        fee: shippingFee.toFixed(2),
        provider: shippingProvider,
        status: "pending",
      });

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));

      return { order };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { order } = result;
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
      },
    });
  } catch (error) {
    // Unique-violation on (profile_id, idempotency_key) means a concurrent
    // duplicate request raced us — fetch and return the order it created.
    if (error instanceof Error && "code" in error && (error as { code?: string }).code === "23505") {
      const body = await request.clone().json().catch(() => null);
      const key = body?.idempotencyKey;
      const session = await getSession();
      if (session && key) {
        const [dup] = await db
          .select()
          .from(orders)
          .where(and(eq(orders.profileId, session.userId), eq(orders.idempotencyKey, key)))
          .limit(1);
        if (dup) {
          return NextResponse.json({
            success: true,
            order: { id: dup.id, orderNumber: dup.orderNumber, total: dup.total, status: dup.status },
          });
        }
      }
    }
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "خطأ في إنشاء الطلب" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.profileId, session.userId))
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({ orders: userOrders });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
