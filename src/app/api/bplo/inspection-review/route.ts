import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { prisma } from "@/lib/prisma";
import { formatChecklistItemsForReadOnlyApi } from "@/lib/jit-post-audit-checklist";

export async function GET() {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inspections = await prisma.inspection.findMany({
    where: {
      complianceStatus: "PENDING_REVIEW",
      status: "DH_VERIFICATION_PENDING",
      businessRecord: {
        businessStatus: "ACTIVE",
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      businessRecordId: true,
      applicationId: true,
      complianceStatus: true,
      status: true,
      comment: true,
      referToBplo: true,
      referralReason: true,
      referralRemarks: true,
      evidenceFileName: true,
      evidenceMimeType: true,
      evidenceStoragePath: true,
      createdAt: true,
      inspector: {
        select: { name: true, email: true },
      },
      application: {
        select: {
          applicationNumber: true,
          applicationType: true,
          status: true,
          permitIssuance: {
            select: { documentNumber: true },
          },
        },
      },
      businessRecord: {
        select: {
          businessName: true,
          tradeName: true,
          ownerName: true,
          businessType: true,
          lineOfBusiness: true,
          location: {
            select: { address: true, barangay: true },
          },
        },
      },
      checklistItems: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          departmentKey: true,
          question: true,
          response: true,
          remarks: true,
          evidenceFileName: true,
          evidenceMimeType: true,
          evidenceStoragePath: true,
        },
      },
    },
  });

  const rows = inspections.map((inspection) => ({
    inspectionId: inspection.id,
    businessRecordId: inspection.businessRecordId,
    applicationId: inspection.applicationId,
    applicationNumber: inspection.application?.applicationNumber ?? "N/A",
    permitNumber: inspection.application?.permitIssuance?.documentNumber ?? null,
    businessName: inspection.businessRecord.businessName ?? "Unknown",
    tradeName: inspection.businessRecord.tradeName ?? null,
    ownerName: inspection.businessRecord.ownerName ?? "Unknown",
    businessType: inspection.businessRecord.businessType ?? "N/A",
    lineOfBusiness: inspection.businessRecord.lineOfBusiness ?? "N/A",
    businessAddress: inspection.businessRecord.location?.address ?? "N/A",
    barangay: inspection.businessRecord.location?.barangay ?? "N/A",
    inspectorName: inspection.inspector?.name ?? inspection.inspector?.email ?? "Unknown",
    inspectionDate: inspection.createdAt.toISOString(),
    comment: inspection.comment,
    referToBplo: inspection.referToBplo,
    referralReason: inspection.referralReason,
    referralRemarks: inspection.referralRemarks,
    hasEvidence: Boolean(inspection.evidenceStoragePath),
    evidenceFileName: inspection.evidenceFileName,
    evidenceMimeType: inspection.evidenceMimeType,
    checklistItems: formatChecklistItemsForReadOnlyApi(inspection.checklistItems),
  }));

  return NextResponse.json({ rows });
}
