import { NextResponse } from "next/server";
import { createApplicantDocument, listApplicantDocuments } from "@/lib/applications";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";
import { removeApplicantDocument, storeApplicantDocument } from "@/lib/document-storage";
import { logDocumentAction } from "@/lib/audit-log";
import {
  DOCUMENT_UPLOAD_ERROR_MAX_SIZE,
  DOCUMENT_UPLOAD_ERROR_UNSUPPORTED_TYPE,
  isAllowedDocumentMimeType,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from "@/lib/document-upload-rules";

interface RouteContext {
  params: Promise<{ applicationId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  try {
    const { applicationId } = await context.params;
    const documents = await listApplicantDocuments(authContext.applicantId, applicationId);
    return NextResponse.json({ documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load documents";
    const status = message === "Application not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  const session = authContext.session;

  try {
    const { applicationId } = await context.params;
    const formData = await req.formData();
    const documentNameValue = formData.get("documentName");
    const fileValue = formData.get("file");

    if (typeof documentNameValue !== "string" || !documentNameValue.trim()) {
      return NextResponse.json({ error: "documentName is required" }, { status: 400 });
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (fileValue.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: DOCUMENT_UPLOAD_ERROR_MAX_SIZE }, { status: 400 });
    }

    if (!isAllowedDocumentMimeType(fileValue.type)) {
      return NextResponse.json({ error: DOCUMENT_UPLOAD_ERROR_UNSUPPORTED_TYPE }, { status: 400 });
    }

    const uploaded = await storeApplicantDocument(fileValue, {
      applicationId,
      documentType: documentNameValue.trim(),
    });
    let document;
    try {
      document = await createApplicantDocument(authContext.applicantId, applicationId, {
        documentName: documentNameValue.trim(),
        fileName: uploaded.fileName,
        storagePath: uploaded.storagePath,
        bucket: uploaded.bucket,
        filePath: uploaded.storagePath,
        originalName: fileValue.name || uploaded.fileName,
        mimeType: uploaded.mimeType,
        sizeBytes: uploaded.sizeBytes,
        fileSize: uploaded.sizeBytes,
      });
    } catch (error) {
      await removeApplicantDocument(uploaded.storagePath, uploaded.mimeType);
      throw error;
    }

    // Audit: Document upload
    void logDocumentAction(
      authContext.applicantId,
      session.user.name ?? session.user.email ?? null,
      "APPLICANT",
      document.id,
      documentNameValue.trim(),
      applicationId,
      "UPLOADED",
      `Document uploaded: ${documentNameValue.trim()}`,
      { mimeType: uploaded.mimeType, sizeBytes: uploaded.sizeBytes }
    );

    return NextResponse.json({
      document: {
        id: document.id,
        documentType: document.documentName,
        documentName: document.documentName,
        fileName: document.fileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload document";
    const status =
      message === "Application not found"
        ? 404
        : message === "This application has already been submitted and is now locked for review."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
