import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import { getDepartmentHeadApprovalDocument, requireDepartmentHeadSession } from "@/lib/department-head-api";
import { createStoredFileDelivery, resolveRequestPublicOrigin } from "@/lib/document-storage";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const document = await getDepartmentHeadApprovalDocument(applicationId, documentId);
    const wantsDownload = new URL(req.url).searchParams.get("download") === "1";

    const delivery = await createStoredFileDelivery({
      storagePath: document.storagePath,
      mimeType: document.mimeType,
      expiresIn: 60,
      download: wantsDownload,
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
      message === "Application not found" ||
      message === "Document not found" ||
      message === "Stored file not found"
        ? 404
        : 400;
    return NextResponse.json(
      { error: safeApiErrorMessage(error, "Unable to preview document") },
      { status }
    );
  }
}
