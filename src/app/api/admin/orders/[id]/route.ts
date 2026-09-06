import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders, orderItems, orderStatusHistory, sellerOrders, payments, shipping, profiles
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const [items, history, sellerOrdersList, paymentsList, shippingInfo] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, id)),
      db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(desc(orderStatusHistory.createdAt)),
      db.select().from(sellerOrders).where(eq(sellerOrders.orderId, id)),
      db.select().from(payments).where(eq(payments.orderId, id)),
      db.select().from(shipping).where(eq(shipping.orderId, id)).limit(1),
    ]);

    return NextResponse.json({
      order,
      items,
      history,
      sellerOrders: sellerOrdersList,
      payments: paymentsList,
      shipping: shippingInfo[0] || null,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("Admin order detail error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const { status, notes } = await request.json();

    const validStatuses = ["new", "confirmed", "preparing", "ready_for_shipping", "shipped", "delivered", "cancelled", "returned"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
    }

    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id));

    await db.insert(orderStatusHistory).values({
      orderId: id,
      status,
      notes: notes || null,
      actorId: session.userId,
      actorRole: "admin",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
