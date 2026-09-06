import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
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
    const { nameAr, nameEn, descriptionAr, descriptionEn, displayOrder, isActive } = body;

    await db.update(categories).set({
      ...(nameAr !== undefined && { nameAr }),
      ...(nameEn !== undefined && { nameEn }),
      ...(descriptionAr !== undefined && { descriptionAr }),
      ...(descriptionEn !== undefined && { descriptionEn }),
      ...(displayOrder !== undefined && { displayOrder }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    }).where(eq(categories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("Admin category update error:", error);
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

    // Check if category has products
    const [productCount] = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.categoryId, id));

    if (productCount.count > 0) {
      // Disable instead of delete to preserve data
      await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
      return NextResponse.json({ 
        success: true, 
        message: "تم تعطيل التصنيف بدلاً من حذفه لأنه يحتوي على منتجات" 
      });
    }

    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("Admin category delete error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
