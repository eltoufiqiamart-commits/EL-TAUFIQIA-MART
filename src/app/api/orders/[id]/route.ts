import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, orderStatusHistory, sellerOrders, payments, shipping } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

const VALID_STATUSES = ["new", "confirmed", "preparing", "ready_for_shipping", "shipped", "delivered", "cancelled", "returned"] as const;
const VALID_PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
const VALID_SHIPPING_STATUSES = ["pending", "processing", "shipped", "delivered", "returned", "cancelled"] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

    const [items, history, sellerOrdersList, paymentsList, shippingInfo] = await Promise.all([
      db.select().from(orderItems).where(eq(orderItems.orderId, id)),
      db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(desc(orderStatusHistory.createdAt)),
      db.select().from(sellerOrders).where(eq(sellerOrders.orderId, id)),
      db.select().from(payments).where(eq(payments.orderId, id)).orderBy(desc(payments.createdAt)),
      db.select().from(shipping).where(eq(shipping.orderId, id)).limit(1),
    ]);

    return NextResponse.json({ order, items, history, sellerOrders: sellerOrdersList, payments: paymentsList, shipping: shippingInfo[0] || null });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
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
    const body = await request.json();

    const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

    const status = body.status as string | undefined;
    const paymentStatus = body.paymentStatus as string | undefined;
    const shippingStatus = body.shippingStatus as string | undefined;
    const trackingNumber = typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : undefined;
    const shippingNotes = typeof body.shippingNotes === "string" ? body.shippingNotes.trim() : undefined;
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (status && !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) return NextResponse.json({ error: "حالة الطلب غير صالحة" }, { status: 400 });
    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus as typeof VALID_PAYMENT_STATUSES[number])) return NextResponse.json({ error: "حالة الدفع غير صالحة" }, { status: 400 });
    if (shippingStatus && !VALID_SHIPPING_STATUSES.includes(shippingStatus)) return NextResponse.json({ error: "حالة الشحن غير صالحة" }, { status: 400 });

    await db.transaction(async (tx) => {
      const now = new Date();
      if (status && status !== existing.status) {
        await tx.update(orders).set({ status: status as typeof existing.status, updatedAt: now }).where(eq(orders.id, id));
        await tx.insert(orderStatusHistory).values({ orderId: id, status: status as typeof existing.status, notes: notes || null, actorId: session.userId, actorRole: "admin" });

        const shippingPatch: Record<string, unknown> = { updatedAt: now };
        if (status === "shipped") { shippingPatch.status = "shipped"; shippingPatch.shippedAt = now; }
        if (status === "delivered") { shippingPatch.status = "delivered"; shippingPatch.deliveredAt = now; }
        if (status === "cancelled") shippingPatch.status = "cancelled";
        if (Object.keys(shippingPatch).length > 1) await tx.update(shipping).set(shippingPatch as never).where(eq(shipping.orderId, id));
      } else if (notes) {
        await tx.insert(orderStatusHistory).values({ orderId: id, status: existing.status, notes, actorId: session.userId, actorRole: "admin" });
      }

      if (paymentStatus) {
        await tx.update(orders).set({ paymentStatus: paymentStatus as typeof existing.paymentStatus, updatedAt: now }).where(eq(orders.id, id));
        await tx.update(payments).set({ status: paymentStatus as typeof existing.paymentStatus, confirmedAt: paymentStatus === "paid" ? now : undefined }).where(eq(payments.orderId, id));
      }

      if (shippingStatus || trackingNumber !== undefined || shippingNotes !== undefined) {
        const [currentShipping] = await tx.select().from(shipping).where(eq(shipping.orderId, id)).limit(1);
        if (!currentShipping) {
          await tx.insert(shipping).values({ orderId: id, fee: existing.shippingFee, status: shippingStatus || "pending", trackingNumber: trackingNumber || null, notes: shippingNotes || null, updatedAt: now });
        } else {
          await tx.update(shipping).set({
            ...(shippingStatus ? { status: shippingStatus } : {}),
            ...(trackingNumber !== undefined ? { trackingNumber: trackingNumber || null } : {}),
            ...(shippingNotes !== undefined ? { notes: shippingNotes || null } : {}),
            ...(shippingStatus === "shipped" ? { shippedAt: now } : {}),
            ...(shippingStatus === "delivered" ? { deliveredAt: now } : {}),
            updatedAt: now,
          }).where(eq(shipping.orderId, id));
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "خطأ في تحديث الطلب" }, { status: 500 });
  }
}
