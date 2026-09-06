import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vehicleModels } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const makeId = searchParams.get("makeId") || "";

    if (!makeId) {
      return NextResponse.json({ models: [] });
    }

    const models = await db
      .select()
      .from(vehicleModels)
      .where(and(eq(vehicleModels.makeId, makeId), eq(vehicleModels.isActive, true)))
      .orderBy(asc(vehicleModels.nameEn));

    return NextResponse.json({ models });
  } catch (error) {
    console.error("Vehicle models error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
