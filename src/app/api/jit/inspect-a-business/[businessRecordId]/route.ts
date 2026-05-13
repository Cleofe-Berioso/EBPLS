import { NextResponse } from "next/server";
import { removeApplicantDocument, storeApplicantDocument } from "@/lib/document-storage";
import { requireJitSession } from "@/lib/jit-api";
import { createJitInspection } from "@/lib/jit-inspections";

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
    complianceStatus === "NON_COMPLIANT" &&
    evidence instanceof File &&
    evidence.size > 0 &&
    !evidence.type.startsWith("image/")
  ) {
    return NextResponse.json({ error: "Photo evidence must be an image file" }, { status: 422 });
  }

  let storedEvidencePath: string | null = null;

  try {
    const storedEvidence =
      evidence instanceof File && evidence.size > 0
        ? await storeApplicantDocument(evidence)
        : null;

    storedEvidencePath = storedEvidence?.storagePath ?? null;

    const inspection = await createJitInspection(businessRecordId, session.user.id, {
      complianceStatus,
      comment,
      evidence: storedEvidence
        ? {
            fileName: storedEvidence.fileName,
            storagePath: storedEvidence.storagePath,
            mimeType: storedEvidence.mimeType,
            sizeBytes: storedEvidence.sizeBytes,
          }
        : undefined,
    });

    return NextResponse.json({ inspection });
  } catch (error) {
    if (storedEvidencePath) {
      await removeApplicantDocument(storedEvidencePath);
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
