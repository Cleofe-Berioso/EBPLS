import { NextResponse } from "next/server";
import {
  ApplicantEligibilityError,
  DuplicateBusinessIdentityError,
  listApplicantApplications,
  saveApplicantApplication,
  SubmitValidationError,
} from "@/lib/applications";
import {
  APPLICANT_ACCOUNT_NOT_FOUND_MESSAGE,
  resolveApplicantSessionContext,
} from "@/lib/applicant-api";
import type { SaveApplicationInput } from "@/lib/applicant-types";
import { logApplicationAction } from "@/lib/audit-log";
import {
  DOCUMENT_UPLOAD_ERROR_MAX_SIZE,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from "@/lib/document-upload-rules";

interface SubmitFileInput {
  documentName: string;
  file: File;
}

function hasUnsafeDocumentPayload(payload: SaveApplicationInput): boolean {
  if (!Array.isArray(payload.documents)) {
    return false;
  }

  return payload.documents.some((doc) => {
    const docRecord = doc as unknown as Record<string, unknown>;
    const values = Object.values(docRecord);
    const hasRawLikeField = ["file", "blob", "base64", "content", "preview", "dataUrl"].some(
      (key) => key in docRecord
    );

    if (hasRawLikeField) {
      return true;
    }

    if (typeof doc.sizeBytes === "number" && doc.sizeBytes > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      return true;
    }

    if (typeof doc.fileSize === "number" && doc.fileSize > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      return true;
    }

    return values.some(
      (value) =>
        typeof value === "string" &&
        (value.startsWith("data:") || (value.length > 10000 && value.toLowerCase().includes("base64")))
    );
  });
}

function logApplicantApi(event: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[ApplicantApplicationsAPI] ${event}`, data);
  }
}

export async function GET() {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  const rows = await listApplicantApplications(authContext.applicantId);
  return NextResponse.json({ applications: rows });
}

export async function POST(req: Request) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  const session = authContext.session;

  let payload: SaveApplicationInput;
  let submitFiles: SubmitFileInput[] = [];
  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const payloadRaw = formData.get("payload");

      if (typeof payloadRaw !== "string") {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }

      payload = JSON.parse(payloadRaw) as SaveApplicationInput;

      const documentNames = formData.getAll("documentNames").filter((value): value is string => typeof value === "string");
      const documentFiles = formData.getAll("documentFiles").filter((value): value is File => value instanceof File);

      if (documentFiles.length > 0) {
        return NextResponse.json(
          {
            error:
              "Upload documents per file using the documents endpoint before final submit. Final submit only accepts metadata.",
          },
          { status: 400 }
        );
      }

      submitFiles = documentFiles.map((file, index) => ({
        file,
        documentName: (documentNames[index] ?? "").trim(),
      }));
    } else {
      payload = (await req.json()) as SaveApplicationInput;
    }
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!payload?.applicationType || !payload?.formData || !payload?.mode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (payload.mode === "SUBMIT" && submitFiles.some((entry) => !entry.documentName || !(entry.file instanceof File))) {
    return NextResponse.json({ error: "Invalid document upload metadata" }, { status: 400 });
  }

  if (hasUnsafeDocumentPayload(payload)) {
    const oversizedDocument = payload.documents?.some(
      (doc) =>
        (typeof doc.sizeBytes === "number" && doc.sizeBytes > MAX_DOCUMENT_FILE_SIZE_BYTES) ||
        (typeof doc.fileSize === "number" && doc.fileSize > MAX_DOCUMENT_FILE_SIZE_BYTES)
    );

    return NextResponse.json(
      { error: oversizedDocument ? DOCUMENT_UPLOAD_ERROR_MAX_SIZE : "Invalid document payload." },
      { status: 400 }
    );
  }

  if (!["NEW", "RENEWAL", "CLOSURE"].includes(payload.applicationType)) {
    return NextResponse.json({ error: "Invalid application type" }, { status: 400 });
  }

  if (!["DRAFT", "SUBMIT"].includes(payload.mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  logApplicantApi("request", {
    userId: session.user.id,
    userEmail: session.user.email ?? null,
    mode: payload.mode,
    applicationType: payload.applicationType,
    applicationId: payload.applicationId ?? null,
  });

  try {
    const saved = await saveApplicantApplication(authContext.applicantId, payload, submitFiles);
    logApplicantApi("success", {
      userId: session.user.id,
      userEmail: session.user.email ?? null,
      applicationId: saved.id,
      applicationNumber: saved.applicationNumber,
      status: saved.status,
      submittedAt: saved.submittedAt,
    });

    // Audit: Application submission
    if (payload.mode === "SUBMIT") {
      void logApplicationAction(
        authContext.applicantId,
        session.user.name ?? session.user.email ?? null,
        "APPLICANT",
        saved.id,
        saved.applicationNumber,
        "SUBMITTED",
        "DRAFT",
        saved.status,
        `${payload.applicationType} application submitted`,
        {
          applicationType: payload.applicationType,
          documentCount: submitFiles.length,
          closureType: payload.closureType ?? null,
          closureTypeOtherReason: payload.closureTypeOtherReason ?? null,
        }
      );
    }

    return NextResponse.json({ application: saved });
  } catch (error) {
    if (error instanceof SubmitValidationError) {
      return NextResponse.json(
        {
          error: "Application is incomplete. Complete all required fields and documents before submitting.",
          detail: error.detail,
        },
        { status: 400 }
      );
    }

    if (error instanceof DuplicateBusinessIdentityError) {
      return NextResponse.json(
        { error: "This already exist", duplicateField: error.field },
        { status: 400 }
      );
    }

    if (error instanceof ApplicantEligibilityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unable to save application";
    const status =
      message === APPLICANT_ACCOUNT_NOT_FOUND_MESSAGE
        ? 401
        :
      message === "Application not found"
        ? 404
        : message === "This application has already been submitted and is now locked for review."
          ? 403
          : 400;
    logApplicantApi("error", {
      userId: session.user.id,
      userEmail: session.user.email ?? null,
      mode: payload.mode,
      applicationType: payload.applicationType,
      error: message,
      status,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
