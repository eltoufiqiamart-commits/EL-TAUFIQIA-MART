import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, profiles } from "@/db/schema";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (q) {
      conditions.push(
        or(
          ilike(orders.orderNumber, `%${q}%`),
          ilike(orders.customerName, `%${q}%`),
          ilike(orders.customerPhone, `%${q}%`)
        )!
      );
    }

    if (status) {
      conditions.push(eq(orders.status, status as "new" | "confirmed" | "preparing" | "ready_for_shipping" | "shipped" | "delivered" | "cancelled" | "returned"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ orders: rows });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("Admin orders error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
