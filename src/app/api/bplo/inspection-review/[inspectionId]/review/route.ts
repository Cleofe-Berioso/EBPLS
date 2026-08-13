import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import { requireBploSession } from "@/lib/bplo-api";
import { prisma } from "@/lib/prisma";
import { logInspectionAction } from "@/lib/audit-log";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inspectionId } = await params;

  let payload: { complianceStatus?: string; remarks?: string } = {};
  try {
    payload = (await req.json()) as { complianceStatus?: string; remarks?: string };
  } catch {
    payload = {};
  }

  const complianceStatus = payload.complianceStatus?.trim();
  const remarks = payload.remarks?.trim();

  if (complianceStatus !== "COMPLIANT" && complianceStatus !== "NON_COMPLIANT") {
    return NextResponse.json(
      { error: "complianceStatus must be COMPLIANT or NON_COMPLIANT" },
      { status: 422 }
    );
  }

  if (!remarks) {
    return NextResponse.json({ error: "Remarks are required" }, { status: 422 });
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const inspection = await tx.inspection.findUnique({
        where: { id: inspectionId },
        select: {
          id: true,
          complianceStatus: true,
          status: true,
          applicationId: true,
          businessRecordId: true,
          application: {
            select: {
              applicationNumber: true,
              status: true,
            },
          },
        },
      });

      if (!inspection) {
        throw new Error("Inspection not found");
      }

      if (inspection.complianceStatus !== "PENDING_REVIEW") {
        throw new Error("Only PENDING_REVIEW inspections can be reviewed by BPLO");
      }

      const updated = await tx.inspection.update({
        where: { id: inspectionId },
        data: {
          complianceStatus,
          bploComplianceReviewedById: session.user.id,
          bploComplianceReviewedAt: new Date(),
          bploComplianceRemarks: remarks,
        },
        select: {
          id: true,
          complianceStatus: true,
          status: true,
          applicationId: true,
          businessRecordId: true,
        },
      });

      if (inspection.applicationId) {
        await tx.applicationHistory.create({
          data: {
            applicationId: inspection.applicationId,
            actorId: session.user.id,
            actorRole: "BPLO",
            fromStatus: inspection.application?.status ?? "RELEASED",
            toStatus: inspection.application?.status ?? "RELEASED",
            remarks: `BPLO compliance review: ${complianceStatus}. ${remarks}`,
          },
        });
      }

      return {
        inspectionId: updated.id,
        complianceStatus: updated.complianceStatus,
        status: updated.status,
        applicationId: updated.applicationId,
        businessRecordId: updated.businessRecordId,
      };
    });

    void logInspectionAction(
      session.user.id,
      session.user.name ?? session.user.email ?? null,
      "BPLO",
      result.inspectionId,
      result.businessRecordId,
      result.applicationId,
      "REVIEWED",
      "PENDING_REVIEW",
      result.complianceStatus,
      complianceStatus as "COMPLIANT" | "NON_COMPLIANT",
      `BPLO compliance review: ${complianceStatus}. ${remarks}`,
      { remarks, complianceStatus }
    );

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "Inspection not found" ? 404 : message.includes("PENDING_REVIEW") ? 422 : 400;
    return NextResponse.json(
      { error: safeApiErrorMessage(error, "Unable to review inspection") },
      { status }
    );
  }
}
