import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import { createStoredFileDelivery, resolveRequestPublicOrigin } from "@/lib/document-storage";
import { getJitApplicationDocument } from "@/lib/jit-declared-inputs";
import { requireJitSession } from "@/lib/jit-api";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const session = await requireJitSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const document = await getJitApplicationDocument(applicationId, documentId);
    const delivery = await createStoredFileDelivery({
      storagePath: document.storagePath,
      mimeType: document.mimeType,
      expiresIn: 60,
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
      message === "Document not found" ||
      message === "Application not available for JIT review" ||
      message === "Stored file not found"
        ? 404
        : 400;
    return NextResponse.json({ error: safeApiErrorMessage(error, "Unable to preview document") }, { status });
  }
}
