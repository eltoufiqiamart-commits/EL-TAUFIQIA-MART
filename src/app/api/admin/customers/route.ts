import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, desc, or, ilike, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const q = new URL(request.url).searchParams.get("q")?.trim();
    const search = q ? or(ilike(profiles.email, `%${q}%`), ilike(profiles.fullName, `%${q}%`), ilike(profiles.phone, `%${q}%`)) : undefined;
    const rows = await db.select({ id: profiles.id, email: profiles.email, fullName: profiles.fullName, phone: profiles.phone, role: profiles.role, createdAt: profiles.createdAt, updatedAt: profiles.updatedAt, isActive: profiles.isActive })
      .from(profiles).where(search ? and(eq(profiles.role, "customer"), search) : eq(profiles.role, "customer")).orderBy(desc(profiles.createdAt));
    return NextResponse.json({ customers: rows });
  } catch { return NextResponse.json({ error: "غير مصرح" }, { status: 401 }); }
}
