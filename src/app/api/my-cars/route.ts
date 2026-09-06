import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerCars, vehicleMakes, vehicleModels } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const cars = await db
      .select({
        id: customerCars.id,
        nickname: customerCars.nickname,
        year: customerCars.year,
        isDefault: customerCars.isDefault,
        customMake: customerCars.customMake,
        customModel: customerCars.customModel,
        makeNameAr: vehicleMakes.nameAr,
        makeNameEn: vehicleMakes.nameEn,
        modelNameAr: vehicleModels.nameAr,
        modelNameEn: vehicleModels.nameEn,
        makeId: customerCars.makeId,
        modelId: customerCars.modelId,
        createdAt: customerCars.createdAt,
      })
      .from(customerCars)
      .leftJoin(vehicleMakes, eq(customerCars.makeId, vehicleMakes.id))
      .leftJoin(vehicleModels, eq(customerCars.modelId, vehicleModels.id))
      .where(eq(customerCars.profileId, session.userId));

    return NextResponse.json({ cars });
  } catch (error) {
    console.error("My cars GET error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const body = await request.json();
    const { makeId, modelId, generationId, engineId, year, nickname, customMake, customModel, isDefault } = body;

    if (isDefault) {
      // Unset other defaults
      await db
        .update(customerCars)
        .set({ isDefault: false })
        .where(eq(customerCars.profileId, session.userId));
    }

    const [car] = await db.insert(customerCars).values({
      profileId: session.userId,
      makeId: makeId || undefined,
      modelId: modelId || undefined,
      generationId: generationId || undefined,
      engineId: engineId || undefined,
      year: year || undefined,
      nickname,
      customMake,
      customModel,
      isDefault: isDefault || false,
    }).returning();

    return NextResponse.json({ car });
  } catch (error) {
    console.error("My cars POST error:", error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
