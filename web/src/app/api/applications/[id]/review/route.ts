import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  broadcastApplicationStatusChange,
  broadcastNotification,
} from "@/lib/sse";
import { sendApplicationStatusEmail } from "@/lib/email";
import { captureException } from "@/lib/monitoring";
import { reviewActionSchema } from "@/lib/validations";
import { REVIEWABLE_APPLICATION_STATUSES } from "@/lib/workflow";

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

    const { id } = await params;    const body = await request.json();
    const validated = reviewActionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }
    const { action, comment } = validated.data;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        applicant: true,
        previousPermit: true,
        documents: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (!REVIEWABLE_APPLICATION_STATUSES.includes(application.status)) {
      return NextResponse.json(
        {
          error: "Invalid application status",
          message: `Cannot review application in ${application.status} status.`,
        },
        { status: 409 }
      );
    }

    const activeDocuments = application.documents.filter(
      (document) => document.status !== "REJECTED"
    );

    if (action === "APPROVE") {
      const minDocsRequired = application.type === "NEW" ? 2 : 1;
      if (activeDocuments.length < minDocsRequired) {
        return NextResponse.json(
          {
            error: "Cannot approve application",
            message: `${application.type} applications require at least ${minDocsRequired} verified document(s). Current: ${activeDocuments.length}`,
          },
          { status: 400 }
        );
      }
      const unverified = activeDocuments.filter((document) => document.status !== "VERIFIED");
      if (unverified.length > 0) {
        return NextResponse.json(
          {
            error: "Cannot approve application",
            message: "All active documents must be verified before assessment/payment.",
          },
          { status: 400 }
        );
      }
    }

    // Determine new status
    let newStatus = application.status;
    if (action === "APPROVE") newStatus = "PAYMENT_PENDING";
    else if (action === "REJECT") newStatus = "REJECTED";
    else if (action === "REQUEST_REVISION") newStatus = "RETURNED_FOR_CORRECTION";
    else if (action === "COMMENT") newStatus = "UNDER_REVIEW";

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: newStatus,
        ...(action === "APPROVE" && {
          approvedAt: new Date(),
          reviewedAt: new Date(),
          documentVerified: true,
          applicationApproved: true,
        }),
        ...(action === "REJECT" && {
          rejectedAt: new Date(),
          reviewedAt: new Date(),
          rejectionReason: comment || null,
        }),
        ...(action === "REQUEST_REVISION" && {
          reviewedAt: new Date(),
          rejectionReason: comment || "Returned for correction",
        }),
      },
    });

    // Create review action
    await prisma.reviewAction.create({
      data: {
        applicationId: id,
        reviewerId: session.user.id,
        action,
        comment: comment || null,
      },
    });

    // Create history entry
    await prisma.applicationHistory.create({
      data: {
        applicationId: id,
        previousStatus: application.status,
        newStatus,
        comment:
          comment ||
          `Application ${action.toLowerCase().replace("_", " ")} by BPLO office`,
        changedBy: session.user.id,
      },
    });    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `REVIEW_${action}`,
        entity: "Application",
        entityId: id,
        details: { action, comment },
      },
    });    // Broadcast real-time status change to the applicant
    if (action !== "COMMENT") {
      broadcastApplicationStatusChange(
        application.applicantId,
        id,
        application.applicationNumber,
        newStatus,
        application.status
      );
      broadcastNotification(
        application.applicantId,
        "Application Status Updated",
        `Your application ${application.applicationNumber} has been ${action.toLowerCase().replace("_", " ")}.`,
        `/dashboard/applications/${id}`
      );

      // Send email notification (fire-and-forget)
      sendApplicationStatusEmail(
        application.applicant.email,
        `${application.applicant.firstName} ${application.applicant.lastName}`,
        application.applicationNumber,
        newStatus,
        action === "REJECT" ? (comment || undefined) : undefined
      ).catch((err: unknown) => console.error("Email notification error:", err));
    }

    return NextResponse.json({
      message: `Application ${action.toLowerCase().replace("_", " ")} successfully`,
      application: updatedApplication,
    });  } catch (error) {
    captureException(error, { route: 'POST /api/applications/[id]/review' });
    console.error("Review application error:", error);
    return NextResponse.json(
      { error: "Failed to process review action" },
      { status: 500 }
    );
  }
}
