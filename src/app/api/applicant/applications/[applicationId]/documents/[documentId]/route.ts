import { NextResponse } from "next/server";
import { deleteApplicantDocument } from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";
import { removeApplicantDocument } from "@/lib/document-storage";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const removed = await deleteApplicantDocument(session.user.id, applicationId, documentId);
    await removeApplicantDocument(removed.storagePath);
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
