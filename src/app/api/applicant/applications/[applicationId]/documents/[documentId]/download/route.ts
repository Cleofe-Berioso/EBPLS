import { NextResponse } from "next/server";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";
import { getApplicantOwnedDocument } from "@/lib/applications";
import { createStorageSignedUrl } from "@/lib/document-storage";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const document = await getApplicantOwnedDocument(authContext.applicantId, applicationId, documentId);

    const signed = await createStorageSignedUrl({
      storagePath: document.storagePath,
      mimeType: document.mimeType,
      expiresIn: 60,
    });

    return NextResponse.redirect(signed.signedUrl, { status: 302 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to download document";
    const status = message === "Document not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
