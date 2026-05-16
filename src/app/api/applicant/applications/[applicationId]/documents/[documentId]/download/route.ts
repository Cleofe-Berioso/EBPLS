import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { requireApplicantSession } from "@/lib/applicant-api";
import { getApplicantOwnedDocument } from "@/lib/applications";

interface RouteContext {
  params: Promise<{ applicationId: string; documentId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationId, documentId } = await context.params;
    const document = await getApplicantOwnedDocument(session.user.id, applicationId, documentId);

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
    const message = error instanceof Error ? error.message : "Unable to download document";
    const status = message === "Document not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
