import { NextResponse } from "next/server";
import { removeApplicantDocument, storeApplicantDocument } from "@/lib/document-storage";
import { requireJitSession } from "@/lib/jit-api";
import { createJitInspection } from "@/lib/jit-inspections";
import { logInspectionAction } from "@/lib/audit-log";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessRecordId: string }> }
) {
  const session = await requireJitSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { businessRecordId } = await params;
  const formData = await req.formData();

  const complianceStatusRaw = formData.get("complianceStatus");
  const commentRaw = formData.get("comment");
  const evidence = formData.get("evidencePhoto");

  const complianceStatus = typeof complianceStatusRaw === "string" ? complianceStatusRaw.trim() : "";
  const comment = typeof commentRaw === "string" ? commentRaw : undefined;

  if (complianceStatus !== "COMPLIANT" && complianceStatus !== "NON_COMPLIANT") {
    return NextResponse.json({ error: "complianceStatus must be COMPLIANT or NON_COMPLIANT" }, { status: 422 });
  }

  if (
    evidence instanceof File &&
    evidence.size > 0 &&
    !evidence.type.startsWith("image/") &&
    evidence.type !== "application/pdf"
  ) {
    return NextResponse.json({ error: "Photo evidence must be an image or PDF file" }, { status: 422 });
  }

  let storedEvidencePath: string | null = null;
  let storedEvidenceMimeType: string | null = null;

  try {
    const storedEvidence =
      evidence instanceof File && evidence.size > 0
        ? await storeApplicantDocument(evidence, {
            objectPrefix: `jit-inspections/${businessRecordId}/evidence`,
          })
        : null;

    storedEvidencePath = storedEvidence?.storagePath ?? null;
    storedEvidenceMimeType = storedEvidence?.mimeType ?? null;

    const inspection = await createJitInspection(businessRecordId, session.user.id, {
      complianceStatus,
      comment,
      evidence: storedEvidence
        ? {
            fileName: storedEvidence.fileName,
            storagePath: storedEvidence.storagePath,
            bucket: storedEvidence.bucket,
            mimeType: storedEvidence.mimeType,
            sizeBytes: storedEvidence.sizeBytes,
          }
        : undefined,
    });

    const submittedDescription =
      complianceStatus === "COMPLIANT"
        ? "JIT submitted compliant inspection"
        : "JIT submitted non-compliant inspection";

    // Audit: Inspection submitted by JIT
    void logInspectionAction(
      session.user.id,
      session.user.name ?? session.user.email ?? null,
      "JIT",
      inspection.id,
      businessRecordId,
      inspection.applicationId,
      "SUBMITTED",
      null,
      inspection.status,
      complianceStatus as any,
      submittedDescription,
      { comment, hasEvidence: !!storedEvidence }
    );

    if (storedEvidence) {
      void logInspectionAction(
        session.user.id,
        session.user.name ?? session.user.email ?? null,
        "JIT",
        inspection.id,
        businessRecordId,
        inspection.applicationId,
        "REVIEWED",
        inspection.status,
        inspection.status,
        complianceStatus as any,
        "JIT uploaded inspection evidence",
        { evidenceFileName: storedEvidence.fileName }
      );
    }

    return NextResponse.json({ inspection });
  } catch (error) {
    if (storedEvidencePath) {
      await removeApplicantDocument(storedEvidencePath, storedEvidenceMimeType ?? undefined);
    }

    const message = error instanceof Error ? error.message : "Unable to create inspection";
    const status =
      message === "Only active released businesses can be inspected"
        ? 404
        : message.includes("required") || message.includes("must be")
          ? 422
          : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
