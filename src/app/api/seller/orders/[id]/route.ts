import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sellerOrders, orders, orderItems, sellerProfiles, orderStatusHistory } from "@/db/schema";
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

    // Verify seller has access to this order
    const [sellerOrder] = await db
      .select()
      .from(sellerOrders)
      .where(and(eq(sellerOrders.id, id), eq(sellerOrders.sellerId, sellerProfile.id)))
      .limit(1);

    if (!sellerOrder) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, sellerOrder.orderId))
      .limit(1);

    // Only get items for this seller
    const items = await db
      .select()
      .from(orderItems)
      .where(and(eq(orderItems.orderId, sellerOrder.orderId), eq(orderItems.sellerId, sellerProfile.id)));

    return NextResponse.json({ sellerOrder, order, items });
  } catch (error) {
    console.error("Seller order detail error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

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

    if (!sellerProfile) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { id } = await params;
    const { status, notes } = await request.json();

    const sellerAllowedStatuses = ["preparing", "ready_for_shipping", "shipped"];
    if (!sellerAllowedStatuses.includes(status)) {
      return NextResponse.json({ error: "لا يمكنك تعيين هذه الحالة" }, { status: 400 });
    }

    const [sellerOrder] = await db
      .select()
      .from(sellerOrders)
      .where(and(eq(sellerOrders.id, id), eq(sellerOrders.sellerId, sellerProfile.id)))
      .limit(1);

    if (!sellerOrder) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    await db.update(sellerOrders).set({ status, updatedAt: new Date() }).where(eq(sellerOrders.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seller order update error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
