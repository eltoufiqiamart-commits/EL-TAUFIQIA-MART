import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, subcategories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.displayOrder), asc(categories.nameAr));

    const subs = await db
      .select()
      .from(subcategories)
      .where(eq(subcategories.isActive, true))
      .orderBy(asc(subcategories.displayOrder), asc(subcategories.nameAr));

    const categoriesWithSubs = cats.map((cat) => ({
      ...cat,
      subcategories: subs.filter((sub) => sub.categoryId === cat.id),
    }));

    return NextResponse.json({ categories: categoriesWithSubs });
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
