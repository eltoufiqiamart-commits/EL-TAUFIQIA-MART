import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const rows = await db.select({
      id: profiles.id,
      email: profiles.email,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      phone: profiles.phone,
      role: profiles.role,
      createdAt: profiles.createdAt,
      isActive: profiles.isActive,
    }).from(profiles).where(eq(profiles.role, "customer")).orderBy(desc(profiles.createdAt));
    return NextResponse.json({ customers: rows });
  } catch (error) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
