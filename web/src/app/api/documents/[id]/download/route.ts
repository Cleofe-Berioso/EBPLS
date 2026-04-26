import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getPresignedDownloadUrl } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        application: {
          select: { applicantId: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // APPLICANT can only download their own documents
    if (
      session.user.role === "APPLICANT" &&
      document.application.applicantId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate a presigned download URL (valid for 1 hour)
    const downloadUrl = await getPresignedDownloadUrl(document.filePath, 3600, document.mimeType);

    // Log the download activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DOCUMENT_DOWNLOAD",
        entity: "Document",
        entityId: id,
        details: {
          fileName: document.originalName,
          documentType: document.documentType,
        },
      },
    });

    return NextResponse.json({
      downloadUrl,
      fileName: document.originalName,
      mimeType: document.mimeType,
    });
  } catch (error) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
