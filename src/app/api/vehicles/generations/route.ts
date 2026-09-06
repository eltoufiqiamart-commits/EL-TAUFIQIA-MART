import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vehicleGenerations } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get("modelId") || "";

    if (!modelId) {
      return NextResponse.json({ generations: [] });
    }

    const generations = await db
      .select()
      .from(vehicleGenerations)
      .where(and(eq(vehicleGenerations.modelId, modelId), eq(vehicleGenerations.isActive, true)))
      .orderBy(asc(vehicleGenerations.yearFrom));

    return NextResponse.json({ generations });
  } catch (error) {
    console.error("Vehicle generations error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
