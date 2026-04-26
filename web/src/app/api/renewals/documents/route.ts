/**
 * GET /api/renewals/documents
 * Fetch all documents related to the user's renewal applications
 *
 * Access: APPLICANT (own documents), BPLO_OFFICE (any)
 * Returns: List of documents with status, verification info
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { captureException } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Build where clause based on role
    const where: any = {};

    if (session.user.role === "APPLICANT") {
      // APPLICANT: only documents from their renewal applications
      where.application = {
        applicantId: session.user.id,
        type: "RENEWAL",
      };
    } else {
      // BPLO_OFFICE: documents from renewal applications only
      where.application = {
        type: "RENEWAL",
      };
    }

    // Fetch documents
    const documents = await prisma.document.findMany({
      where,
      select: {
        id: true,
        fileName: true,
        originalName: true,
        documentType: true,
        status: true,
        fileSize: true,
        filePath: true,
        createdAt: true,
        verifiedAt: true,
        rejectionReason: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response
    const formattedDocuments = documents.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      originalName: doc.originalName,
      documentType: doc.documentType,
      status: doc.status,
      fileSize: doc.fileSize,
      createdAt: doc.createdAt.toISOString(),
      verifiedAt: doc.verifiedAt?.toISOString() || null,
      rejectionReason: doc.rejectionReason,
      filePath: doc.filePath,
    }));

    // Log activity
    if (session.user.role === "APPLICANT") {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "RENEWAL_DOCUMENTS_VIEWED",
          entity: "Document",
          details: {
            count: documents.length,
          },
        },
      });
    }

    return NextResponse.json({
      documents: formattedDocuments,
      total: documents.length,
      message: `Retrieved ${documents.length} renewal documents`,
    });
  } catch (error) {
    captureException(error, { route: "GET /api/renewals/documents" });
    console.error("Renewal documents error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve renewal documents" },
      { status: 500 }
    );
  }
}
