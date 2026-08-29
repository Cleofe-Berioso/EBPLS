import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";
import { getApplicantOwnedDocument } from "@/lib/applications";
import { createStoredFileDelivery, resolveRequestPublicOrigin } from "@/lib/document-storage";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const document = await getApplicantOwnedDocument(authContext.applicantId, applicationId, documentId);

    const delivery = await createStoredFileDelivery({
      storagePath: document.storagePath,
      mimeType: document.mimeType,
      expiresIn: 60,
      download: true,
      downloadFileName: document.fileName || document.documentName || "document",
    });

    if (delivery.mode === "stream") {
      return delivery.response;
    }

    let redirectUrl = delivery.signedUrl;
    if (redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
      redirectUrl = `${resolveRequestPublicOrigin(req)}${redirectUrl}`;
    }

    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status =
      message === "Document not found" || message === "Stored file not found" ? 404 : 400;
    return NextResponse.json({ error: safeApiErrorMessage(error, "Unable to download document") }, { status });
  }
}
