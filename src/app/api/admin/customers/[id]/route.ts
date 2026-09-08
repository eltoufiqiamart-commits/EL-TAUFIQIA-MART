import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const existing = await db.select({ id: profiles.id }).from(profiles).where(and(eq(profiles.id, id), eq(profiles.role, "customer"))).limit(1);
    if (!existing[0]) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    const update: Partial<typeof profiles.$inferInsert> = {};
    if (typeof body.fullName === "string") update.fullName = body.fullName.trim() || null;
    if (typeof body.phone === "string") update.phone = body.phone.trim() || null;
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;
    if (!Object.keys(update).length) return NextResponse.json({ error: "لا توجد تعديلات صالحة" }, { status: 400 });
    update.updatedAt = new Date();
    const [customer] = await db.update(profiles).set(update).where(and(eq(profiles.id, id), eq(profiles.role, "customer"))).returning({ id: profiles.id, email: profiles.email, fullName: profiles.fullName, phone: profiles.phone, isActive: profiles.isActive, updatedAt: profiles.updatedAt });
    return NextResponse.json({ customer });
  } catch { return NextResponse.json({ error: "غير مصرح" }, { status: 401 }); }
}
