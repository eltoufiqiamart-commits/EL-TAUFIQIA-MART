import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerCars } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(customerCars)
      .where(and(eq(customerCars.id, id), eq(customerCars.profileId, session.userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("My cars DELETE error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isDefault, nickname } = body;

    if (isDefault) {
      await db
        .update(customerCars)
        .set({ isDefault: false })
        .where(eq(customerCars.profileId, session.userId));
    }

    await db
      .update(customerCars)
      .set({
        ...(isDefault !== undefined && { isDefault }),
        ...(nickname !== undefined && { nickname }),
      })
      .where(and(eq(customerCars.id, id), eq(customerCars.profileId, session.userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("My cars PATCH error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
