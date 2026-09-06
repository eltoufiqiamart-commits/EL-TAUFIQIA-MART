import { NextResponse } from "next/server";
import { db } from "@/db";
import { shippingMethods } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const methods = await db
      .select()
      .from(shippingMethods)
      .where(eq(shippingMethods.isActive, true))
      .orderBy(asc(shippingMethods.displayOrder));

    return NextResponse.json({ methods });
  } catch (error) {
    console.error("Shipping methods error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
