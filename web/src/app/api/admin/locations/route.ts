import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  EB_MAGALONA_DB_FILTER,
  EB_MAGALONA_OUTSIDE_DB_FILTER,
  GEO_MAP_LOCATION_INCLUDE,
  LOCATION_ELIGIBLE_APPLICATION_STATUSES,
  LOCATION_REVIEWABLE_STATUSES,
  normalizeGeoMapLocation,
} from "@/lib/locations";

function canReadBusinessLocations(role?: string) {
  return role === "ADMIN" || role === "BPLO_OFFICE";
}

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user || !canReadBusinessLocations(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const takeParam = searchParams.get("take");
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const take = takeParam ? Math.min(500, Math.max(1, parseInt(takeParam, 10))) : undefined;
    const skip = take ? (page - 1) * take : undefined;

    const [approvedLocations, reviewQueue, approvedCount, pendingCount, rejectedCount, hiddenOutsideBoundaryCount] =
      await Promise.all([
        prisma.businessLocation.findMany({
          where: {
            status: "APPROVED",
            application: {
              status: {
                in: [...LOCATION_ELIGIBLE_APPLICATION_STATUSES],
              },
            },
            ...EB_MAGALONA_DB_FILTER,
          },
          ...(typeof skip === "number" ? { skip } : {}),
          ...(typeof take === "number" ? { take } : {}),
          include: GEO_MAP_LOCATION_INCLUDE,
          orderBy: { reviewedAt: "desc" },
        }),
        prisma.businessLocation.findMany({
          where: {
            status: {
              in: [...LOCATION_REVIEWABLE_STATUSES],
            },
          },
          include: GEO_MAP_LOCATION_INCLUDE,
          orderBy: { submittedAt: "desc" },
        }),
        prisma.businessLocation.count({
          where: {
            status: "APPROVED",
            application: {
              status: {
                in: [...LOCATION_ELIGIBLE_APPLICATION_STATUSES],
              },
            },
            ...EB_MAGALONA_DB_FILTER,
          },
        }),
        prisma.businessLocation.count({
          where: { status: "SUBMITTED" },
        }),
        prisma.businessLocation.count({
          where: { status: "REJECTED" },
        }),
        prisma.businessLocation.count({
          where: EB_MAGALONA_OUTSIDE_DB_FILTER,
        }),
      ]);

    return NextResponse.json({
      locations: approvedLocations.map((location) => normalizeGeoMapLocation(location)),
      submissions: reviewQueue.map((location) => normalizeGeoMapLocation(location)),
      total: approvedCount,
      page,
      pages: take ? Math.ceil(approvedCount / take) : 1,
      pendingCount,
      rejectedCount,
      hiddenOutsideBoundaryCount,
    });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}
