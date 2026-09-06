import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, categories, brands, vehicleMakes, vehicleModels, shippingMethods } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { timingSafeEqual } from "crypto";

// Bootstrap endpoint: creates the first admin account and seeds reference
// data (categories/brands/vehicle catalog/shipping methods) into a fresh
// database. It is intended to be called ONCE, by an operator, right after
// provisioning the database.
//
// Security model:
//   - INIT_SECRET must be set in the environment. There is NO fallback.
//   - The caller must present that exact secret via the
//     `x-init-secret` header. Constant-time comparison is used.
//   - If an admin account already exists, the endpoint refuses to run again
//     (it will not reset passwords or create additional admins).
//   - ADMIN_PASSWORD must be supplied via environment variable; there is no
//     default/fallback password.
export async function POST(request: NextRequest) {
  const initSecret = process.env.INIT_SECRET;

  if (!initSecret || initSecret.length < 16) {
    return NextResponse.json(
      { error: "Server is not configured for initialization (INIT_SECRET missing)." },
      { status: 503 }
    );
  }

  const provided = request.headers.get("x-init-secret") || "";
  const a = Buffer.from(provided);
  const b = Buffer.from(initSecret);
  const secretMatches = a.length === b.length && timingSafeEqual(a, b);

  if (!secretMatches) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL and a strong ADMIN_PASSWORD (12+ chars) must be set in the environment." },
      { status: 503 }
    );
  }

  try {
    // Refuse to run if ANY admin already exists — this is a one-time bootstrap,
    // not a reset mechanism.
    const existingAdmin = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.role, "admin"))
      .limit(1);

    if (existingAdmin.length > 0) {
      return NextResponse.json(
        { error: "An admin account already exists. Initialization can only run once." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(adminPassword);
    await db.insert(profiles).values({
      email: adminEmail.toLowerCase(),
      passwordHash,
      fullName: "مدير النظام",
      role: "admin",
    });

    // Seed reference data (idempotent: skips anything that already exists).
    const categoryData = [
      { nameAr: "المحرك", nameEn: "Engine", slug: "engine", displayOrder: 1 },
      { nameAr: "ناقل الحركة", nameEn: "Transmission", slug: "transmission", displayOrder: 2 },
      { nameAr: "الكلتش", nameEn: "Clutch", slug: "clutch", displayOrder: 3 },
      { nameAr: "الفرامل", nameEn: "Brakes", slug: "brakes", displayOrder: 4 },
      { nameAr: "التعليق", nameEn: "Suspension", slug: "suspension", displayOrder: 5 },
      { nameAr: "التوجيه", nameEn: "Steering", slug: "steering", displayOrder: 6 },
      { nameAr: "الكهرباء", nameEn: "Electrical", slug: "electrical", displayOrder: 7 },
      { nameAr: "التبريد", nameEn: "Cooling", slug: "cooling", displayOrder: 8 },
      { nameAr: "نظام الوقود", nameEn: "Fuel System", slug: "fuel-system", displayOrder: 9 },
      { nameAr: "الهواء والسحب", nameEn: "Air & Intake", slug: "air-intake", displayOrder: 10 },
      { nameAr: "العادم", nameEn: "Exhaust", slug: "exhaust", displayOrder: 11 },
      { nameAr: "الهيكل", nameEn: "Body", slug: "body", displayOrder: 12 },
      { nameAr: "الداخلية", nameEn: "Interior", slug: "interior", displayOrder: 13 },
      { nameAr: "الإضاءة", nameEn: "Lighting", slug: "lighting", displayOrder: 14 },
      { nameAr: "التكييف والتدفئة", nameEn: "AC & Heating", slug: "ac-heating", displayOrder: 15 },
      { nameAr: "الفلاتر", nameEn: "Filters", slug: "filters", displayOrder: 16 },
      { nameAr: "زيوت ومواد التشحيم", nameEn: "Lubricants", slug: "lubricants", displayOrder: 17 },
      { nameAr: "إكسسوارات", nameEn: "Accessories", slug: "accessories", displayOrder: 18 },
      { nameAr: "أدوات", nameEn: "Tools", slug: "tools", displayOrder: 19 },
    ];
    for (const cat of categoryData) {
      const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, cat.slug)).limit(1);
      if (existing.length === 0) await db.insert(categories).values(cat);
    }

    const brandData = [
      { nameAr: "بوش", nameEn: "Bosch", slug: "bosch" },
      { nameAr: "دنلوب", nameEn: "Dunlop", slug: "dunlop" },
      { nameAr: "فيلبس", nameEn: "Philips", slug: "philips" },
      { nameAr: "NGK", nameEn: "NGK", slug: "ngk" },
      { nameAr: "موبيل", nameEn: "Mobil", slug: "mobil" },
      { nameAr: "شل", nameEn: "Shell", slug: "shell" },
      { nameAr: "كاسترول", nameEn: "Castrol", slug: "castrol" },
      { nameAr: "SKF", nameEn: "SKF", slug: "skf" },
      { nameAr: "جابريل", nameEn: "Gabriel", slug: "gabriel" },
      { nameAr: "مونرو", nameEn: "Monroe", slug: "monroe" },
      { nameAr: "فريني", nameEn: "Ferodo", slug: "ferodo" },
      { nameAr: "ترو", nameEn: "TRW", slug: "trw" },
      { nameAr: "فالتا", nameEn: "Varta", slug: "varta" },
      { nameAr: "مان", nameEn: "Mann", slug: "mann" },
      { nameAr: "هيلا", nameEn: "Hella", slug: "hella" },
    ];
    for (const brand of brandData) {
      const existing = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, brand.slug)).limit(1);
      if (existing.length === 0) await db.insert(brands).values(brand);
    }

    const makeData: { nameAr: string; nameEn: string; slug: string; displayOrder: number; models?: { nameAr: string; nameEn: string; slug: string }[] }[] = [
      { nameAr: "شيفروليه", nameEn: "Chevrolet", slug: "chevrolet", displayOrder: 1, models: [
        { nameAr: "أوبترا", nameEn: "Optra", slug: "optra" },
        { nameAr: "أفيو", nameEn: "Aveo", slug: "aveo" },
        { nameAr: "كروز", nameEn: "Cruze", slug: "cruze" },
        { nameAr: "ماليبو", nameEn: "Malibu", slug: "malibu" },
        { nameAr: "كابتيفا", nameEn: "Captiva", slug: "captiva" },
        { nameAr: "سبارك", nameEn: "Spark", slug: "spark" },
        { nameAr: "ترابلازر", nameEn: "Trailblazer", slug: "trailblazer" },
      ] },
      { nameAr: "كيا", nameEn: "Kia", slug: "kia", displayOrder: 2, models: [
        { nameAr: "سيراتو", nameEn: "Cerato", slug: "cerato" },
        { nameAr: "سبورتاج", nameEn: "Sportage", slug: "sportage" },
        { nameAr: "ريو", nameEn: "Rio", slug: "rio" },
        { nameAr: "سونيت", nameEn: "Sonet", slug: "sonet" },
        { nameAr: "سيلتوس", nameEn: "Seltos", slug: "seltos" },
      ] },
      { nameAr: "هيونداي", nameEn: "Hyundai", slug: "hyundai", displayOrder: 3, models: [
        { nameAr: "أكسنت", nameEn: "Accent", slug: "accent" },
        { nameAr: "إيلانترا", nameEn: "Elantra", slug: "elantra" },
        { nameAr: "توسان", nameEn: "Tucson", slug: "tucson" },
        { nameAr: "سانتافي", nameEn: "Santa Fe", slug: "santa-fe" },
        { nameAr: "i10", nameEn: "i10", slug: "i10" },
        { nameAr: "i20", nameEn: "i20", slug: "i20" },
      ] },
      { nameAr: "تويوتا", nameEn: "Toyota", slug: "toyota", displayOrder: 4, models: [
        { nameAr: "كورولا", nameEn: "Corolla", slug: "corolla" },
        { nameAr: "كامري", nameEn: "Camry", slug: "camry" },
        { nameAr: "هايلكس", nameEn: "Hilux", slug: "hilux" },
        { nameAr: "برادو", nameEn: "Prado", slug: "prado" },
        { nameAr: "يارس", nameEn: "Yaris", slug: "yaris" },
      ] },
      { nameAr: "نيسان", nameEn: "Nissan", slug: "nissan", displayOrder: 5 },
      { nameAr: "بيجو", nameEn: "Peugeot", slug: "peugeot", displayOrder: 6 },
      { nameAr: "رينو", nameEn: "Renault", slug: "renault", displayOrder: 7 },
      { nameAr: "سوزوكي", nameEn: "Suzuki", slug: "suzuki", displayOrder: 8 },
      { nameAr: "مرسيدس", nameEn: "Mercedes-Benz", slug: "mercedes-benz", displayOrder: 9 },
      { nameAr: "BMW", nameEn: "BMW", slug: "bmw", displayOrder: 10 },
      { nameAr: "فولكسفاجن", nameEn: "Volkswagen", slug: "volkswagen", displayOrder: 11 },
      { nameAr: "هوندا", nameEn: "Honda", slug: "honda", displayOrder: 12 },
      { nameAr: "ميتسوبيشي", nameEn: "Mitsubishi", slug: "mitsubishi", displayOrder: 13 },
      { nameAr: "مازدا", nameEn: "Mazda", slug: "mazda", displayOrder: 14 },
      { nameAr: "سكودا", nameEn: "Skoda", slug: "skoda", displayOrder: 15 },
    ];

    for (const make of makeData) {
      const existing = await db.select({ id: vehicleMakes.id }).from(vehicleMakes).where(eq(vehicleMakes.slug, make.slug)).limit(1);
      if (existing.length === 0) {
        const [inserted] = await db.insert(vehicleMakes).values({
          nameAr: make.nameAr, nameEn: make.nameEn, slug: make.slug, displayOrder: make.displayOrder,
        }).returning();
        if (make.models) {
          for (const model of make.models) {
            await db.insert(vehicleModels).values({ makeId: inserted.id, ...model });
          }
        }
      }
    }

    const shippingData = [
      { nameAr: "توصيل عادي", nameEn: "Standard Delivery", provider: "internal", fee: "50.00", estimatedDays: 3, displayOrder: 1 },
      { nameAr: "توصيل سريع", nameEn: "Express Delivery", provider: "internal", fee: "100.00", estimatedDays: 1, displayOrder: 2 },
      { nameAr: "استلام من الفرع", nameEn: "Store Pickup", provider: "pickup", fee: "0.00", estimatedDays: 0, displayOrder: 3 },
    ];
    for (const method of shippingData) {
      const existing = await db.select({ id: shippingMethods.id }).from(shippingMethods).where(eq(shippingMethods.nameEn, method.nameEn)).limit(1);
      if (existing.length === 0) await db.insert(shippingMethods).values(method);
    }

    return NextResponse.json({ success: true, message: "تم تهيئة قاعدة البيانات بنجاح" });
  } catch (error) {
    console.error("Init error:", error);
    return NextResponse.json({ error: "خطأ في التهيئة" }, { status: 500 });
  }
}
