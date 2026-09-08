import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, products, orders, orderItems, profiles } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId مطلوب" }, { status: 400 });
  const rows = await db.select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, createdAt: reviews.createdAt, customerName: profiles.fullName })
    .from(reviews).leftJoin(profiles, eq(reviews.profileId, profiles.id))
    .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))
    .orderBy(desc(reviews.createdAt));
  return NextResponse.json({ reviews: rows });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "customer") return NextResponse.json({ error: "يجب تسجيل الدخول كعميل" }, { status: 401 });
    const body = await request.json();
    const productId = String(body.productId || "");
    const orderItemId = String(body.orderItemId || "");
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) : null;
    if (!productId || !orderItemId || !Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "بيانات التقييم غير صحيحة" }, { status: 400 });

    const [item] = await db.select({ itemId: orderItems.id, itemProductId: orderItems.productId, orderId: orders.id, status: orders.status })
      .from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orderItems.id, orderItemId), eq(orderItems.productId, productId), eq(orders.profileId, session.userId)))
      .limit(1);
    if (!item || item.status !== "delivered") return NextResponse.json({ error: "يمكن تقييم المنتجات بعد استلام الطلب فقط" }, { status: 400 });

    const existing = await db.select({ id: reviews.id }).from(reviews)
      .where(and(eq(reviews.profileId, session.userId), eq(reviews.productId, productId))).limit(1);
    if (existing.length) return NextResponse.json({ error: "سبق لك تقييم هذا المنتج" }, { status: 409 });

    const [review] = await db.insert(reviews).values({ productId, profileId: session.userId, orderItemId, rating, comment, isApproved: false }).returning();
    return NextResponse.json({ review, message: "تم إرسال التقييم للمراجعة" }, { status: 201 });
  } catch (error) {
    console.error("Review create error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
