import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { getSuperAdminApplicationDocument } from "@/lib/superadmin-data";
import { createStorageSignedUrl } from "@/lib/document-storage";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const document = await getSuperAdminApplicationDocument(applicationId, documentId);
    const signed = await createStorageSignedUrl({
      storagePath: document.storagePath,
      mimeType: document.mimeType,
      expiresIn: 60,
    });

    return NextResponse.redirect(signed.signedUrl, { status: 302 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "Application not found" || message === "Document not found" ? 404 : 400;
      return NextResponse.json({ error: safeApiErrorMessage(error, "Unable to preview document") }, { status });
  }
}
