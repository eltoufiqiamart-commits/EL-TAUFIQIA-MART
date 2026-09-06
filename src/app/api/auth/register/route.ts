import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, password, fullName, phone } = parsed.data;

    // Check existing
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newProfile] = await db
      .insert(profiles)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        phone,
        role: "customer",
      })
      .returning();

    const token = await createSession({
      userId: newProfile.id,
      email: newProfile.email,
      role: newProfile.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: newProfile.id,
        email: newProfile.email,
        fullName: newProfile.fullName,
        role: newProfile.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
