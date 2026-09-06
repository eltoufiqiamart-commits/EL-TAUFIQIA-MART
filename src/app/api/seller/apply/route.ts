import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, sellerApplications, sellerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, getSession, setSessionCookie } from "@/lib/auth";
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

    const result = await db.transaction(async (tx) => {
      const [profile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.id, session.userId))
        .limit(1);

      if (!profile) {
        throw new Error("PROFILE_NOT_FOUND");
      }

      if (profile.role === "seller") {
        throw new Error("ALREADY_SELLER");
      }

      const [existingApplication] = await tx
        .select()
        .from(sellerApplications)
        .where(eq(sellerApplications.profileId, session.userId))
        .limit(1);

      let applicationId: string;

      if (existingApplication) {
        applicationId = existingApplication.id;
        await tx
          .update(sellerApplications)
          .set({
            storeName,
            storeNameAr,
            description,
            phone,
            address,
            taxId,
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: null,
            updatedAt: new Date(),
          })
          .where(eq(sellerApplications.id, existingApplication.id));
      } else {
        const [application] = await tx
          .insert(sellerApplications)
          .values({
            profileId: session.userId,
            storeName,
            storeNameAr,
            description,
            phone,
            address,
            taxId,
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: null,
          })
          .returning({ id: sellerApplications.id });

        applicationId = application.id;
      }

      await tx
        .update(profiles)
        .set({ role: "seller", phone, updatedAt: new Date() })
        .where(eq(profiles.id, session.userId));

      const [existingSellerProfile] = await tx
        .select({ id: sellerProfiles.id })
        .from(sellerProfiles)
        .where(eq(sellerProfiles.profileId, session.userId))
        .limit(1);

      if (existingSellerProfile) {
        await tx
          .update(sellerProfiles)
          .set({
            storeName,
            storeNameAr,
            description,
            phone,
            address,
            status: "approved",
            updatedAt: new Date(),
          })
          .where(eq(sellerProfiles.id, existingSellerProfile.id));
      } else {
        await tx.insert(sellerProfiles).values({
          profileId: session.userId,
          storeName,
          storeNameAr,
          description,
          phone,
          address,
          status: "approved",
        });
      }

      return { applicationId };
    });

    const token = await createSession({
      userId: session.userId,
      email: session.email,
      role: "seller",
    });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      applicationId: result.applicationId,
      message: "تم تفعيل حساب البائع بنجاح. يمكنك الآن الدخول إلى لوحة البائع.",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PROFILE_NOT_FOUND") {
        return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });
      }
      if (error.message === "ALREADY_SELLER") {
        return NextResponse.json({ error: "حسابك مفعل بالفعل كبائع" }, { status: 409 });
      }
    }

    console.error("Seller apply error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
