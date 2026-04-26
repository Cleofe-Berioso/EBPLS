import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { businessLocationSchema } from "@/lib/validations";
import {
  EB_MAGALONA_DB_FILTER,
  EB_MAGALONA_OUTSIDE_DB_FILTER,
  normalizeGeoMapLocation,
} from "@/lib/locations";
import { NextResponse } from "next/server";

function canReadBusinessLocations(role?: string) {
  return role === "ADMIN" || role === "BPLO_OFFICE";
}

const locationInclude = {
  application: {
    select: {
      id: true,
      applicationNumber: true,
      businessName: true,
      businessType: true,
      businessAddress: true,
      type: true,
      status: true,
      permit: {
        select: {
          status: true,
        },
      },
    },
  },
} as const;

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

    const [locations, totalVisible, hiddenOutsideBoundaryCount] = await Promise.all([
      prisma.businessLocation.findMany({
        where: EB_MAGALONA_DB_FILTER,
        ...(typeof skip === "number" ? { skip } : {}),
        ...(typeof take === "number" ? { take } : {}),
        include: locationInclude,
        orderBy: { createdAt: "desc" },
      }),
      prisma.businessLocation.count({
        where: EB_MAGALONA_DB_FILTER,
      }),
      prisma.businessLocation.count({
        where: EB_MAGALONA_OUTSIDE_DB_FILTER,
      }),
    ]);

    const normalizedLocations = locations.map((location) =>
      normalizeGeoMapLocation({
        ...location,
        application: location.application
          ? {
              ...location.application,
              applicationNumber: location.application.applicationNumber,
              businessName: location.application.businessName,
              businessType: location.application.businessType,
              businessAddress: location.application.businessAddress,
              type: location.application.type,
              status: location.application.status,
              permit: location.application.permit
                ? { status: location.application.permit.status }
                : null,
            }
          : null,
      })
    );

    return NextResponse.json({
      locations: normalizedLocations,
      total: totalVisible,
      page,
      pages: take ? Math.ceil(totalVisible / take) : 1,
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

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = businessLocationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const app = await prisma.application.findUnique({
      where: { id: validated.data.applicationId },
    });

    if (!app) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    const existing = await prisma.businessLocation.findUnique({
      where: { applicationId: validated.data.applicationId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Location already exists for this application" },
        { status: 409 }
      );
    }

    const location = await prisma.businessLocation.create({
      data: {
        applicationId: validated.data.applicationId,
        latitude: validated.data.latitude,
        longitude: validated.data.longitude,
        label: validated.data.label,
        businessType: validated.data.businessType,
        markerColor: validated.data.markerColor,
      },
      include: locationInclude,
    });

    return NextResponse.json(
      {
        location: normalizeGeoMapLocation({
          ...location,
          application: location.application
            ? {
                ...location.application,
                permit: location.application.permit
                  ? { status: location.application.permit.status }
                  : null,
              }
            : null,
        }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
