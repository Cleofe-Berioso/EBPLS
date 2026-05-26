import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { getBploApplicationDocument } from "@/lib/bplo-applications";
import { createStorageSignedUrl } from "@/lib/document-storage";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const document = await getBploApplicationDocument(applicationId, documentId);
    const signed = await createStorageSignedUrl({
      storagePath: document.storagePath,
      mimeType: document.mimeType,
      expiresIn: 60,
      download: true,
      downloadFileName: document.fileName,
    });

    // Ensure absolute URL for redirect. If relative, convert to absolute.
    let redirectUrl = signed.signedUrl;
    if (redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
      const origin = new URL(req.url).origin;
      redirectUrl = `${origin}${redirectUrl}`;
    }

    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to download document";
    const status =
      message === "Application not found" || message === "Document not found"
        ? 404
        : message === "Application is not available for BPLO review" ||
            message === "Document does not belong to the requested application"
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
