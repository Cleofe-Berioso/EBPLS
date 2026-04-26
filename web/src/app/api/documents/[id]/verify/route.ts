import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { broadcastDocumentVerified, broadcastNotification } from "@/lib/sse";
import { captureException } from "@/lib/monitoring";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BPLO_OFFICE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        application: { select: { applicantId: true } },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        status,
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
        ...(status === "REJECTED" && {
          rejectionReason: body.reason || "Document rejected during verification",
        }),
      },
    });

    const remainingActiveDocuments = await prisma.document.count({
      where: {
        applicationId: document.applicationId,
        status: { notIn: ["VERIFIED", "REJECTED"] },
      },
    });

    if (status === "VERIFIED" && remainingActiveDocuments === 0) {
      await prisma.application.update({
        where: { id: document.applicationId },
        data: {
          documentVerified: true,
          status: "UNDER_REVIEW",
        },
      });
    } else if (status === "REJECTED") {
      await prisma.application.update({
        where: { id: document.applicationId },
        data: { documentVerified: false },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `DOCUMENT_${status}`,
        entity: "Document",
        entityId: id,
      },
    });

    // Broadcast real-time event to the document owner (non-blocking)
    const applicantId = document.application.applicantId;
    try {
      broadcastDocumentVerified(applicantId, id, document.originalName, status);
    } catch (error) {
      console.error("Failed to broadcast document verified event:", error);
    }

    try {
      broadcastNotification(
        applicantId,
        status === "VERIFIED" ? "Document Verified" : "Document Rejected",
        status === "VERIFIED"
          ? `Your document "${document.originalName}" has been verified.`
          : `Your document "${document.originalName}" was rejected. Please re-upload.`,
        "/dashboard/documents"
      );
    } catch (error) {
      console.error("Failed to broadcast document notification:", error);
    }

    return NextResponse.json({ document: updated });  } catch (error) {
    captureException(error, { route: 'POST /api/documents/[id]/verify' });
    console.error("Verify document error:", error);
    return NextResponse.json(
      { error: "Failed to verify document" },
      { status: 500 }
    );
  }
}
