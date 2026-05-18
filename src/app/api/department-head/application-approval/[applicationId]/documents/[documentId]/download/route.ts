import { NextResponse } from "next/server";
import { getDepartmentHeadApprovalDocument, requireDepartmentHeadSession } from "@/lib/department-head-api";
import { createStorageSignedUrl } from "@/lib/document-storage";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const document = await getDepartmentHeadApprovalDocument(applicationId, documentId);
    const signed = await createStorageSignedUrl({
      storagePath: document.storagePath,
      mimeType: document.mimeType,
      expiresIn: 60,
    });

    return NextResponse.redirect(signed.signedUrl, { status: 302 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to preview document";
    const status = message === "Application not found" || message === "Document not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
