import { NextResponse } from "next/server";
import { getApplicantApplicationDetail, getApplicantTopSummary, submitApplicantPaymentReference } from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";
import { storeApplicantDocument } from "@/lib/document-storage";
import { removeApplicantDocument } from "@/lib/document-storage";
import { formatOwnerName } from "@/lib/person-name";

export async function GET() {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getApplicantTopSummary(session.user.id);
  return NextResponse.json({ summary });
}

export async function POST(req: Request) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.formData();
  const applicationId = body.get("applicationId");
  const transactionNumber = body.get("transactionNumber");
  const proofFile = body.get("paymentProof");

  if (
    typeof applicationId !== "string" ||
    typeof transactionNumber !== "string" ||
    !applicationId.trim() ||
    !transactionNumber.trim()
  ) {
    return NextResponse.json(
      { error: "applicationId, Official Receipt Number, and paymentProof are required" },
      { status: 400 }
    );
  }

  if (!(proofFile instanceof File)) {
    return NextResponse.json(
      { error: "applicationId, Official Receipt Number, and paymentProof are required" },
      { status: 400 }
    );
  }

  try {
    const application = await getApplicantApplicationDetail(session.user.id, applicationId.trim());
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const formDataRecord = application.formData as Record<string, unknown>;
    const applicantName = formatOwnerName({
      ownerFirstName: typeof formDataRecord.ownerFirstName === "string" ? formDataRecord.ownerFirstName : undefined,
      ownerMiddleName: typeof formDataRecord.ownerMiddleName === "string" ? formDataRecord.ownerMiddleName : undefined,
      ownerLastName: typeof formDataRecord.ownerSurname === "string" ? formDataRecord.ownerSurname : undefined,
      ownerSuffix: typeof formDataRecord.ownerSuffix === "string" ? formDataRecord.ownerSuffix : undefined,
      ownerName: typeof formDataRecord.ownerName === "string" ? formDataRecord.ownerName : undefined,
    });

    const storedProof = await storeApplicantDocument(proofFile, {
      applicationId: applicationId.trim(),
      documentType: "payment-proof",
      applicantName,
    });
    try {
      const result = await submitApplicantPaymentReference(
        session.user.id,
        applicationId.trim(),
        transactionNumber.trim(),
        {
          proofFileName: storedProof.fileName,
          proofStoragePath: storedProof.storagePath,
          proofBucket: storedProof.bucket,
          proofMimeType: storedProof.mimeType,
          proofSizeBytes: storedProof.sizeBytes,
        }
      );

      return NextResponse.json({ result });
    } catch (innerError) {
      await removeApplicantDocument(storedProof.storagePath, storedProof.mimeType);
      throw innerError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit OR details";
    const status = message === "Application not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
