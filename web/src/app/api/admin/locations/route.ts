import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { businessLocationSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "BPLO_OFFICE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const take = parseInt(searchParams.get("take") || "15");
    const skip = (page - 1) * take;

    const [locations, total] = await Promise.all([
      prisma.businessLocation.findMany({
        skip,
        take,
        include: {
          application: {
            select: {
              id: true,
              applicationNumber: true,
              businessName: true,
              businessType: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.businessLocation.count(),
    ]);

    return NextResponse.json({
      locations,
      total,
      page,
      pages: Math.ceil(total / take),
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

  if (!session?.user || session.user.role !== "BPLO_OFFICE") {
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
      include: {
        application: {
          select: {
            id: true,
            applicationNumber: true,
            businessName: true,
            businessType: true,
          },
        },
      },
    });

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 }
    );
  }
}
