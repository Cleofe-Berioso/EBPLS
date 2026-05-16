import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { getSuperAdminApplicationDocument } from "@/lib/superadmin-data";

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
    const buffer = await readFile(document.storagePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${document.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to preview document";
    const status = message === "Application not found" || message === "Document not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
