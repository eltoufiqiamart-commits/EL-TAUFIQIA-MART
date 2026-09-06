import { NextResponse } from "next/server";
import { getSession, getProfile } from "@/lib/auth";
import { db } from "@/db";
import { sellerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const profile = await getProfile(session.userId);
    if (!profile) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    let sellerProfile = null;
    if (profile.role === "seller") {
      const [sp] = await db
        .select()
        .from(sellerProfiles)
        .where(eq(sellerProfiles.profileId, profile.id))
        .limit(1);
      sellerProfile = sp || null;
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        phone: profile.phone,
        role: profile.role,
        avatarUrl: profile.avatarUrl,
      },
      sellerProfile,
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
