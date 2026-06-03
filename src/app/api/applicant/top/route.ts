import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import { getApplicantApplicationDetail, getApplicantTopSummary, submitApplicantPaymentReference } from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";
import { storeApplicantDocument } from "@/lib/document-storage";
import { removeApplicantDocument } from "@/lib/document-storage";
import { validateDocumentFileUpload } from "@/lib/document-upload-rules";
import { formatOwnerName } from "@/lib/person-name";

const KNOWN_SUBMISSION_ERRORS = new Set([
  "Application not found",
  "OR number is required.",
  "Payment proof is required.",
  "applicationId is required.",
  "Payment reference can only be submitted once the Tax Order of Payment has been generated",
  "Generated TOP is required before submitting payment reference",
  "Your assessment is under re-assessment request. Please wait for BPLO to review before submitting payment.",
  "This OR number has already been submitted. Please check your payment details.",
  "An OR submission is already pending verification",
  "Payment has already been verified and is read-only",
  "TOP amount is invalid for payment submission",
]);

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
  const transactionNumber = body.get("orNumber") ?? body.get("transactionNumber") ?? body.get("officialReceiptNumber");
  const proofFile = body.get("paymentProof");

  if (typeof applicationId !== "string" || !applicationId.trim()) {
    return NextResponse.json({ error: "applicationId is required." }, { status: 400 });
  }

  if (typeof transactionNumber !== "string" || !transactionNumber.trim()) {
    return NextResponse.json({ error: "OR number is required." }, { status: 400 });
  }

  if (!(proofFile instanceof File) || proofFile.size === 0) {
    return NextResponse.json({ error: "Payment proof is required." }, { status: 400 });
  }

  const fileError = validateDocumentFileUpload(proofFile);
  if (fileError) {
    return NextResponse.json({ error: fileError }, { status: 400 });
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
    const message = error instanceof Error ? error.message : "";
    const status = message === "Application not found" ? 404 : 400;
    if (KNOWN_SUBMISSION_ERRORS.has(message)) {
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ error: safeApiErrorMessage(error, "Unable to submit OR details") }, { status });
  }
}
