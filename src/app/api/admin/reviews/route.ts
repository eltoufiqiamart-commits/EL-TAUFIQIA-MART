import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, products, profiles } from "@/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const sp = new URL(request.url).searchParams;
    const status = sp.get("status") || "pending";
    const q = sp.get("q") || "";
    const conditions = [];
    if (status === "approved") conditions.push(eq(reviews.isApproved, true));
    else if (status === "pending") conditions.push(eq(reviews.isApproved, false));
    if (q) conditions.push(or(ilike(products.nameAr, `%${q}%`), ilike(profiles.fullName, `%${q}%`), ilike(reviews.comment, `%${q}%`))!);
    const rows = await db.select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, isApproved: reviews.isApproved, createdAt: reviews.createdAt, productId: products.id, productNameAr: products.nameAr, customerName: profiles.fullName, customerEmail: profiles.email })
      .from(reviews).innerJoin(products, eq(reviews.productId, products.id)).innerJoin(profiles, eq(reviews.profileId, profiles.id))
      .where(conditions.length ? and(...conditions) : undefined).orderBy(desc(reviews.createdAt));
    return NextResponse.json({ reviews: rows });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin reviews error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
