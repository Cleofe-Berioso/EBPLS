import { NextResponse } from "next/server";
import { requireDepartmentHeadSession } from "@/lib/department-head-api";
import { prisma } from "@/lib/prisma";
import { createStorageSignedUrl } from "@/lib/document-storage";

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

  if (!new Set(["REVOCATION_REVIEW", "VERIFIED_NON_COMPLIANT", "REVOKED", "REVOCATION_DENIED"]).has(inspection.status)) {
    return NextResponse.json({ error: "Inspection evidence not available" }, { status: 403 });
  }

  try {
    const signed = await createStorageSignedUrl({
      storagePath: inspection.evidenceStoragePath,
      mimeType: inspection.evidenceMimeType,
      expiresIn: 60,
    });

    return NextResponse.redirect(signed.signedUrl, { status: 302 });
  } catch {
    return NextResponse.json({ error: "Inspection evidence file not found" }, { status: 404 });
  }
}
