import { NextResponse } from "next/server";
import { requireJitSession } from "@/lib/jit-api";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await requireJitSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await prisma.jitNoPermitRecord.findMany({
    where: {
      createdById: session.user.id,
    },
    select: {
      id: true,
      businessName: true,
      personAttended: true,
      lineOfBusiness: true,
      remarks: true,
      latitude: true,
      longitude: true,
      address: true,
      createdAt: true,
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ records });
}

export async function POST(req: Request) {
  const session = await requireJitSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { businessName, personAttended, lineOfBusiness, remarks, latitude, longitude, address } = body;

  // Validation
  if (!businessName || typeof businessName !== "string" || businessName.trim() === "") {
    return NextResponse.json({ error: "businessName is required" }, { status: 400 });
  }
  if (!personAttended || typeof personAttended !== "string" || personAttended.trim() === "") {
    return NextResponse.json({ error: "personAttended is required" }, { status: 400 });
  }
  if (!lineOfBusiness || typeof lineOfBusiness !== "string" || lineOfBusiness.trim() === "") {
    return NextResponse.json({ error: "lineOfBusiness is required" }, { status: 400 });
  }
  if (latitude === undefined || typeof latitude !== "number") {
    return NextResponse.json({ error: "latitude is required and must be a number" }, { status: 400 });
  }
  if (longitude === undefined || typeof longitude !== "number") {
    return NextResponse.json({ error: "longitude is required and must be a number" }, { status: 400 });
  }

  const record = await prisma.jitNoPermitRecord.create({
    data: {
      businessName: businessName.trim(),
      personAttended: personAttended.trim(),
      lineOfBusiness: lineOfBusiness.trim(),
      remarks: remarks ? remarks.trim() : undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address ? address.trim() : undefined,
      createdById: session.user.id,
    },
    select: {
      id: true,
      businessName: true,
      personAttended: true,
      lineOfBusiness: true,
      remarks: true,
      latitude: true,
      longitude: true,
      address: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ record }, { status: 201 });
}
