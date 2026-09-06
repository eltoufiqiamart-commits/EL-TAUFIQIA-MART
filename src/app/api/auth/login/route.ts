import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email.toLowerCase()))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    if (!profile.isActive) {
      return NextResponse.json(
        { error: "تم تعطيل هذا الحساب. يرجى التواصل مع الدعم." },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(password, profile.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const token = await createSession({
      userId: profile.id,
      email: profile.email,
      role: profile.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
