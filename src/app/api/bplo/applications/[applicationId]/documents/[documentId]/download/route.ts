import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { getBploApplicationDocument } from "@/lib/bplo-applications";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const document = await getBploApplicationDocument(applicationId, documentId);
    const buffer = await readFile(document.storagePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `attachment; filename="${document.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
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
