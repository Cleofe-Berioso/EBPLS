import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { requireDepartmentHeadSession } from "@/lib/department-head-api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inspectionId } = await params;
  const inspectionModel = (prisma as any).inspection;
  const inspection = await inspectionModel.findUnique({
    where: { id: inspectionId },
    select: {
      evidenceStoragePath: true,
      evidenceMimeType: true,
      evidenceFileName: true,
      status: true,
    },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  if (!inspection.evidenceStoragePath || !inspection.evidenceMimeType || !inspection.evidenceFileName) {
    return NextResponse.json({ error: "Inspection evidence not found" }, { status: 404 });
  }

  if (!new Set(["DH_VERIFICATION_PENDING", "VERIFIED_COMPLIANT", "VERIFIED_NON_COMPLIANT", "REVOCATION_REVIEW", "REVOKED", "REVOCATION_DENIED"]).has(inspection.status)) {
    return NextResponse.json({ error: "Inspection evidence not available" }, { status: 403 });
  }

  try {
    const buffer = await readFile(inspection.evidenceStoragePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": inspection.evidenceMimeType,
        "Content-Disposition": `inline; filename="${inspection.evidenceFileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Inspection evidence file not found" }, { status: 404 });
  }
}