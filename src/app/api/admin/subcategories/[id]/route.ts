import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subcategories, products } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { nameAr, nameEn, descriptionAr, displayOrder, isActive } = body;

    await db.update(subcategories).set({
      ...(nameAr !== undefined && { nameAr }),
      ...(nameEn !== undefined && { nameEn }),
      ...(descriptionAr !== undefined && { descriptionAr }),
      ...(displayOrder !== undefined && { displayOrder }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    }).where(eq(subcategories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("Admin subcategory update error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [productCount] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.subcategoryId, id));

    if (productCount.count > 0) {
      await db.update(subcategories).set({ isActive: false }).where(eq(subcategories.id, id));
      return NextResponse.json({
        success: true,
        message: "تم تعطيل التصنيف الفرعي لأنه يحتوي على منتجات",
      });
    }

    await db.delete(subcategories).where(eq(subcategories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("Admin subcategory delete error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
