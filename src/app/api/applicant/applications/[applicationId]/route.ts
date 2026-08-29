import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import {
  DuplicateBusinessIdentityError,
  getApplicantApplicationDetail,
  saveApplicantApplication,
} from "@/lib/applications";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";
import type { SaveApplicationInput } from "@/lib/applicant-types";
import {
  buildDocumentMaxSizeError,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  validateDocumentFileUpload,
} from "@/lib/document-upload-rules";

interface RouteContext {
  params: Promise<{ applicationId: string }>;
}

type SubmitFileInput = {
  file: File;
  documentName: string;
};

export async function GET(_req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  const { applicationId } = await context.params;
  const detail = await getApplicantApplicationDetail(authContext.applicantId, applicationId);

  if (!detail) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[ApplicantApplicationDetailAPI] response-shape", {
      applicationId: detail.id,
      keys: Object.keys(detail),
      documentsCount: Array.isArray(detail.documents) ? detail.documents.length : 0,
      historyCount: Array.isArray(detail.history) ? detail.history.length : 0,
    });
  }

  return NextResponse.json({ application: detail });
}

export async function PATCH(req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  const { applicationId } = await context.params;
  const contentType = req.headers.get("content-type") ?? "";

  let payload: SaveApplicationInput;
  let submitFiles: SubmitFileInput[] = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const payloadRaw = formData.get("payload");

      if (typeof payloadRaw !== "string") {
        return NextResponse.json(
          { error: "Invalid request payload. Expected multipart form data with a JSON 'payload' field." },
          { status: 400 }
        );
      }

      payload = JSON.parse(payloadRaw) as SaveApplicationInput;

      const documentNames = formData
        .getAll("documentNames")
        .filter((value): value is string => typeof value === "string");
      const documentFiles = formData
        .getAll("documentFiles")
        .filter((value): value is File => value instanceof File);

      if (documentNames.length !== documentFiles.length) {
        return NextResponse.json({ error: "Invalid document upload metadata" }, { status: 400 });
      }

      submitFiles = documentFiles.map((file, index) => ({
        file,
        documentName: (documentNames[index] ?? "").trim(),
      }));
    } else {
      payload = (await req.json()) as SaveApplicationInput;
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload. Ensure the request body is valid JSON or multipart form data." },
      { status: 400 }
    );
  }

  if (!payload?.applicationType || !payload?.formData || !payload?.mode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  for (const entry of submitFiles) {
    if (!entry.documentName || !(entry.file instanceof File)) {
      return NextResponse.json({ error: "Invalid document upload metadata" }, { status: 400 });
    }

    if (entry.file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: buildDocumentMaxSizeError(entry.file.name) }, { status: 400 });
    }

    const fileValidationError = validateDocumentFileUpload(entry.file);
    if (fileValidationError) {
      return NextResponse.json({ error: fileValidationError }, { status: 400 });
    }
  }

  try {
    const saved = await saveApplicantApplication(
      authContext.applicantId,
      {
        ...payload,
        applicationId,
      },
      submitFiles
    );

    return NextResponse.json({ application: saved });
  } catch (error) {
    if (error instanceof DuplicateBusinessIdentityError) {
      const fieldLabel =
        error.field === "registrationNumber" ? "Registration Number" : "TIN";
      return NextResponse.json(
        {
          error: "This already exist",
          duplicateField: error.field,
          message: `An application with this ${fieldLabel} already exists. Do not proceed with submission.`,
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "";
    const status = message === "Application not found" ? 404 : message.includes("locked for review") ? 403 : 400;
    return NextResponse.json({ error: safeApiErrorMessage(error, "Unable to save application") }, { status });
  }
}
