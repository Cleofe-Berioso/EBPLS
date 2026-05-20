import { NextResponse } from "next/server";
import { deleteApplicantDocument } from "@/lib/applications";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";
import { removeApplicantDocument } from "@/lib/document-storage";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function DELETE(_req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const removed = await deleteApplicantDocument(authContext.applicantId, applicationId, documentId);
    await removeApplicantDocument(removed.storagePath, removed.mimeType);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete document";
    const status =
      message === "Application not found" || message === "Document not found"
        ? 404
        : message === "This application has already been submitted and is now locked for review."
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
