import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be boolean" }, { status: 400 });
    }
    const [updated] = await db.update(profiles)
      .set({ isActive: body.isActive, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning({ id: profiles.id, isActive: profiles.isActive });
    if (!updated) return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    return NextResponse.json({ customer: updated });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
