import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    if (typeof body.isApproved !== "boolean") return NextResponse.json({ error: "حالة التقييم غير صحيحة" }, { status: 400 });
    const [review] = await db.update(reviews).set({ isApproved: body.isApproved }).where(eq(reviews.id, id)).returning();
    if (!review) return NextResponse.json({ error: "التقييم غير موجود" }, { status: 404 });
    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin review update error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
