import { NextResponse } from "next/server";
import { db } from "@/db";
import { sellerOrders, orders, sellerProfiles, orderItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

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

    if (!sellerProfile) {
      return NextResponse.json({ error: "حساب البائع غير موجود" }, { status: 403 });
    }

    const rows = await db
      .select({
        sellerOrderId: sellerOrders.id,
        sellerOrderStatus: sellerOrders.status,
        sellerSubtotal: sellerOrders.subtotal,
        sellerCreatedAt: sellerOrders.createdAt,
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        orderTotal: orders.total,
        orderPaymentMethod: orders.paymentMethod,
        orderCreatedAt: orders.createdAt,
        orderStatus: orders.status,
      })
      .from(sellerOrders)
      .leftJoin(orders, eq(sellerOrders.orderId, orders.id))
      .where(eq(sellerOrders.sellerId, sellerProfile.id))
      .orderBy(desc(sellerOrders.createdAt));

    return NextResponse.json({ orders: rows });
  } catch (error) {
    console.error("Seller orders GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
