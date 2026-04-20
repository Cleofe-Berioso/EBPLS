import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generatePermitNumber, generateClaimReference } from "@/lib/utils";
import {
  broadcastApplicationStatusChange,
  broadcastNotification,
} from "@/lib/sse";
import { sendApplicationStatusEmail } from "@/lib/email";
import { captureException } from "@/lib/monitoring";
import { reviewActionSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only staff, reviewer, or admin can review
    if (session.user.role === "APPLICANT") {
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
        documents: {
          where: { status: { not: "REJECTED" } },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Validate minimum document requirements before approval
    if (action === "APPROVE") {
      const minDocsRequired = application.type === "NEW" ? 2 : 1;
      if (application.documents.length < minDocsRequired) {
        return NextResponse.json(
          {
            error: "Cannot approve application",
            message: `${application.type} applications require at least ${minDocsRequired} document(s). Current: ${application.documents.length}`,
          },
          { status: 400 }
        );
      }
    }

    // Determine new status
    let newStatus = application.status;
    if (action === "APPROVE") newStatus = "APPROVED";
    else if (action === "REJECT") newStatus = "REJECTED";
    else if (action === "REQUEST_REVISION") newStatus = "DRAFT";

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: newStatus,
        ...(action === "APPROVE" && {
          approvedAt: new Date(),
          reviewedAt: new Date(),
        }),
        ...(action === "REJECT" && {
          rejectedAt: new Date(),
          reviewedAt: new Date(),
          rejectionReason: comment || null,
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
          `Application ${action.toLowerCase().replace("_", " ")} by reviewer`,
        changedBy: session.user.id,
      },
    });    // If approved, handle permit creation/closure based on application type
    if (action === "APPROVE") {
      // For RENEWAL: mark the previous permit as RENEWED
      if (application.type === "RENEWAL" && application.previousPermitId) {
        await prisma.permit.update({
          where: { id: application.previousPermitId },
          data: { status: "RENEWED" },
        });
      }

      // For CLOSURE: mark the referenced permit as CLOSED, no new permit created
      if (application.type === "CLOSURE") {
        if (application.previousPermitId) {
          await prisma.permit.update({
            where: { id: application.previousPermitId },
            data: { status: "CLOSED" },
          });
        }
        // Create a closure reference for tracking
        // (removed - claim references no longer used in 3-role system)
      } else {
        // For NEW/RENEWAL: create a new active permit
        const permitCount = await prisma.permit.count();
        const permitNumber = generatePermitNumber(permitCount + 1);

        const permit = await prisma.permit.create({
          data: {
            permitNumber,
            applicationId: id,
            businessName: application.businessName,
            businessAddress: application.businessAddress,
            ownerName: `${application.applicant.firstName} ${application.applicant.lastName}`,
            issueDate: new Date(),
            expiryDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            ),
            status: "ACTIVE",
          },
        });

        // Create permit issuance record with Mayor signing status based on type
        await prisma.permitIssuance.create({
          data: {
            permitId: permit.id,
            issuedById: session.user.id,
            status: "PREPARED",
            // P7.2: For NEW/RENEWAL, mark as pending Mayor signing; for local tests may skip
            mayorSigningStatus:
              application.type === "NEW" || application.type === "RENEWAL"
                ? "PENDING"
                : "NOT_REQUIRED",
          },
        });

        // Generate claim reference
        // (removed - claim references no longer used in 3-role system)
      }
    }    // Log activity
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
