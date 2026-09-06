import { NextResponse } from "next/server";
import { db } from "@/db";
import { vehicleMakes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const makes = await db
      .select()
      .from(vehicleMakes)
      .where(eq(vehicleMakes.isActive, true))
      .orderBy(asc(vehicleMakes.displayOrder), asc(vehicleMakes.nameEn));

    return NextResponse.json({ makes });
  } catch (error) {
    console.error("Vehicle makes error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
