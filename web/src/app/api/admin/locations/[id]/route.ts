import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { businessLocationReviewSchema } from "@/lib/validations";
import {
  canSubmitBusinessLocation,
  isWithinEbMagalona,
  normalizeGeoMapLocation,
} from "@/lib/locations";
import { NextResponse } from "next/server";

function canReviewLocations(role?: string) {
  return role === "ADMIN" || role === "BPLO_OFFICE";
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || !canReviewLocations(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = businessLocationReviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const location = await prisma.businessLocation.findUnique({
      where: { id },
      include: {
        application: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    if (!canSubmitBusinessLocation(location.application.status)) {
      return NextResponse.json(
        { error: "Only released or completed businesses can be reviewed for the GeoMap." },
        { status: 400 }
      );
    }

    if (validated.data.action === "APPROVE" && !isWithinEbMagalona(location.latitude, location.longitude)) {
      return NextResponse.json(
        { error: "Locations outside EB Magalona cannot be approved for the map." },
        { status: 400 }
      );
    }

    const updated = await prisma.businessLocation.update({
      where: { id },
      data: {
        status: validated.data.action === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewedAt: new Date(),
        reviewedById: session.user.id,
        reviewNotes: validated.data.reviewNotes || null,
      },
      include: {
        application: {
          select: {
            id: true,
            applicationNumber: true,
            businessName: true,
            businessType: true,
            lineOfBusiness: true,
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
      },
    });

    return NextResponse.json({
      location: normalizeGeoMapLocation(updated),
    });
  } catch (error) {
    console.error("Error reviewing location:", error);
    return NextResponse.json(
      { error: "Failed to review location" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const location = await prisma.businessLocation.findUnique({
      where: { id },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    await prisma.businessLocation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}
