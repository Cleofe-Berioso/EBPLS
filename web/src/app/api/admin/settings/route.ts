import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { cacheGet, cacheSet, cacheDel, CacheKeys, CacheTTL } from "@/lib/cache";

const updateSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "BPLO_OFFICE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Try cache first
  const cacheKey = CacheKeys.systemSettings();
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json({ settings: cached });
  }

  const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
  await cacheSet(cacheKey, settings, CacheTTL.VERY_LONG);
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "BPLO_OFFICE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const validated = updateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const updates = await Promise.all(
      Object.entries(validated.data).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    // Invalidate cache
    await cacheDel(CacheKeys.systemSettings());

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_SETTINGS",
        entity: "SystemSetting",
        entityId: "system",
        details: { keys: Object.keys(validated.data) },
      },
    });

    return NextResponse.json({ settings: updates });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
