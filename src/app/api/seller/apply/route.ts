import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sellerApplications, sellerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const applySchema = z.object({
  storeName: z.string().min(2),
  storeNameAr: z.string().min(2),
  description: z.string().optional(),
  phone: z.string().min(8),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = applySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const { storeName, storeNameAr, description, phone, address, taxId } = parsed.data;

    // Check if already applied
    const existing = await db
      .select()
      .from(sellerApplications)
      .where(eq(sellerApplications.profileId, session.userId))
      .limit(1);

    if (existing.length > 0) {
      const app = existing[0];
      if (app.status === "pending") {
        return NextResponse.json({ error: "لديك طلب قيد المراجعة بالفعل" }, { status: 409 });
      }
      if (app.status === "approved") {
        return NextResponse.json({ error: "تم قبول طلبك بالفعل كبائع" }, { status: 409 });
      }
    }

    await db.insert(sellerApplications).values({
      profileId: session.userId,
      storeName,
      storeNameAr,
      description,
      phone,
      address,
      taxId,
      status: "pending",
    });

    return NextResponse.json({ success: true, message: "تم إرسال طلبك بنجاح. سيتم مراجعته قريباً." });
  } catch (error) {
    console.error("Seller apply error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
