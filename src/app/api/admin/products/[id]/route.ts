import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

const nullableUuid = (v: unknown) => v === "" || v == null ? null : String(v);
const nullableText = (v: unknown) => v === "" || v == null ? null : String(v);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin product GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const allowed = ["nameAr","nameEn","descriptionAr","descriptionEn","categoryId","subcategoryId","brandId","price","discountPercent","stock","condition","manufacturer","partNumber","oemNumber","crossReference","warranty","weight","supplierName","supplierPhone","supplierAddress","supplierNotes","isActive","isFeatured"] as const;
    const values: Record<string, unknown> = {};
    for (const key of allowed) if (key in body) values[key] = body[key];
    if ("categoryId" in values) values.categoryId = nullableUuid(values.categoryId);
    if ("subcategoryId" in values) values.subcategoryId = nullableUuid(values.subcategoryId);
    if ("brandId" in values) values.brandId = nullableUuid(values.brandId);
    for (const key of ["descriptionAr","descriptionEn","manufacturer","partNumber","oemNumber","crossReference","warranty","weight"] as const) if (key in values) values[key] = nullableText(values[key]);
    if ("price" in values) values.price = String(values.price);
    if ("discountPercent" in values) values.discountPercent = values.discountPercent === "" ? "0" : String(values.discountPercent);
    if ("stock" in values) values.stock = Number(values.stock) || 0;
    values.updatedAt = new Date();
    const [product] = await db.update(products).set(values as never).where(eq(products.id, id)).returning();
    if (!product) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin product update error:", error);
    return NextResponse.json({ error: "خطأ في تحديث المنتج" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [product] = await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id)).returning({ id: products.id });
    if (!product) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    console.error("Admin product deactivate error:", error);
    return NextResponse.json({ error: "خطأ في تحديث المنتج" }, { status: 500 });
  }
}
