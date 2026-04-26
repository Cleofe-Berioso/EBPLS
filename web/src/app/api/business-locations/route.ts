import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { businessLocationSchema } from "@/lib/validations";
import {
  GEO_MAP_LOCATION_INCLUDE,
  canSubmitBusinessLocation,
  normalizeGeoMapLocation,
} from "@/lib/locations";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "APPLICANT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const applications = await prisma.application.findMany({
      where: {
        applicantId: session.user.id,
        status: {
          in: ["RELEASED", "COMPLETED"],
        },
      },
      include: {
        businessLocation: {
          include: GEO_MAP_LOCATION_INCLUDE,
        },
        permit: {
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      applications: applications.map((application) => ({
        id: application.id,
        applicationNumber: application.applicationNumber,
        businessName: application.businessName,
        businessType: application.businessType,
        lineOfBusiness: application.lineOfBusiness,
        businessAddress: application.businessAddress,
        status: application.status,
        permitStatus: application.permit?.status ?? null,
        location: application.businessLocation
          ? normalizeGeoMapLocation(application.businessLocation)
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching applicant business locations:", error);
    return NextResponse.json(
      { error: "Failed to load business locations" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "APPLICANT") {
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

    const application = await prisma.application.findFirst({
      where: {
        id: validated.data.applicationId,
        applicantId: session.user.id,
      },
      include: {
        businessLocation: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (!canSubmitBusinessLocation(application.status)) {
      return NextResponse.json(
        { error: "You can only submit a business location after the permit/application is released or completed." },
        { status: 400 }
      );
    }

    if (application.businessLocation?.status === "APPROVED") {
      return NextResponse.json(
        { error: "This business location is already approved. Please contact BPLO for changes." },
        { status: 409 }
      );
    }

        const payload = {
      latitude: validated.data.latitude,
      longitude: validated.data.longitude,
      businessCategory: validated.data.businessCategory,
      label: validated.data.label || null,
      businessType: application.businessType,
      markerColor: null,
      status: "SUBMITTED" as const,
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedById: null,
      reviewNotes: null,
    };

    const location = application.businessLocation
      ? await prisma.businessLocation.update({
          where: { id: application.businessLocation.id },
          data: payload,
          include: GEO_MAP_LOCATION_INCLUDE,
        })
      : await prisma.businessLocation.create({
          data: {
            applicationId: application.id,
            ...payload,
          },
          include: GEO_MAP_LOCATION_INCLUDE,
        });

    return NextResponse.json(
      {
        location: normalizeGeoMapLocation(location),
      },
      { status: application.businessLocation ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error submitting applicant business location:", error);
    return NextResponse.json(
      { error: "Failed to submit business location" },
      { status: 500 }
    );
  }
}
