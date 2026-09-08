import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vehicleMakes } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try { await requireAdmin(); const makes = await db.select().from(vehicleMakes).orderBy(asc(vehicleMakes.displayOrder), asc(vehicleMakes.nameEn)); return NextResponse.json({ makes }); }
  catch (e) { console.error("Admin vehicle makes GET:", e); return NextResponse.json({ error: "غير مصرح أو خطأ في الخادم" }, { status: 403 }); }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(); const b = await req.json();
    if (!b.nameAr || !b.nameEn) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });
    const base = slugify(b.nameEn) || `make-${Date.now()}`; let slug = base; let n = 1;
    while ((await db.select({ id: vehicleMakes.id }).from(vehicleMakes).where(eq(vehicleMakes.slug, slug)).limit(1)).length) slug = `${base}-${n++}`;
    const [make] = await db.insert(vehicleMakes).values({ nameAr: b.nameAr, nameEn: b.nameEn, slug, logoUrl: b.logoUrl || null, isActive: b.isActive !== false, displayOrder: Number(b.displayOrder) || 0 }).returning();
    return NextResponse.json({ make });
  } catch (e) { console.error("Admin vehicle make POST:", e); return NextResponse.json({ error: "تعذر الحفظ" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  try { await requireAdmin(); const b = await req.json(); if (!b.id || !b.nameAr || !b.nameEn) return NextResponse.json({ error: "البيانات مطلوبة" }, { status: 400 }); const [make] = await db.update(vehicleMakes).set({ nameAr: b.nameAr, nameEn: b.nameEn, logoUrl: b.logoUrl || null, isActive: b.isActive !== false, displayOrder: Number(b.displayOrder) || 0 }).where(eq(vehicleMakes.id, b.id)).returning(); return NextResponse.json({ make }); }
  catch (e) { console.error("Admin vehicle make PATCH:", e); return NextResponse.json({ error: "تعذر التعديل" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  try { await requireAdmin(); const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "المعرف مطلوب" }, { status: 400 }); await db.update(vehicleMakes).set({ isActive: false }).where(eq(vehicleMakes.id, id)); return NextResponse.json({ success: true }); }
  catch (e) { console.error("Admin vehicle make DELETE:", e); return NextResponse.json({ error: "تعذر التعطيل" }, { status: 500 }); }
}
