import { NextResponse } from "next/server";
import { createApplicantDocument, listApplicantDocuments } from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";
import { removeApplicantDocument, storeApplicantDocument } from "@/lib/document-storage";
import { logDocumentAction } from "@/lib/audit-log";

interface RouteContext {
  params: Promise<{ applicationId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId } = await context.params;
    const documents = await listApplicantDocuments(session.user.id, applicationId);
    return NextResponse.json({ documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load documents";
    const status = message === "Application not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request, context: RouteContext) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const uploaded = await storeApplicantDocument(fileValue, {
      applicationId,
      documentType: documentNameValue.trim(),
    });
    let document;
    try {
      document = await createApplicantDocument(session.user.id, applicationId, {
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
      session.user.id,
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
