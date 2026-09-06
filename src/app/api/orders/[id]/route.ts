import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, orderStatusHistory } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { id } = await params;

    const conditions = [eq(orders.id, id)];
    // Non-admin users can only see their own orders
    if (session.role !== "admin") {
      conditions.push(eq(orders.profileId, session.userId));
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const [items, history] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, id)),
      db.select().from(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, id))
        .orderBy(desc(orderStatusHistory.createdAt)),
    ]);

    return NextResponse.json({ order, items, history });
  } catch (error) {
    console.error("Order GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
