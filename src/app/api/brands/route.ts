import { NextResponse } from "next/server";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(brands)
      .where(eq(brands.isActive, true))
      .orderBy(asc(brands.displayOrder), asc(brands.nameEn));

    return NextResponse.json({ brands: rows });
  } catch (error) {
    console.error("Brands error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
