/**
 * GET /api/applications/[id]/clearances
 * POST /api/applications/[id]/clearances
 * P3.0 Phase C: Clearance API Routes
 *
 * GET: List all clearance requirements for application
 * POST: Initiate clearance workflow (transition app to ENDORSED)
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  generateClearancePackages,
  getClearanceSummary,
  getApplicationContext,
} from "@/lib/application-helpers";
import { invalidateApplicationCaches } from "@/lib/cache";
import { sendApplicationStatusEmail } from "@/lib/email";
import { broadcastClearanceInitiated } from "@/lib/sse";
import { captureException } from "@/lib/monitoring";

// **GET /api/applications/[id]/clearances**
// Fetch all clearances for an application with summary info
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await params;

    // Fetch application to verify ownership & access
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        applicationNumber: true,
        type: true,
        status: true,
        applicantId: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Authorization: applicant can only see their own, staff/reviewer/admin can see all
    if (
      session.user.role === "APPLICANT" &&
      application.applicantId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all clearances for this application
    const clearances = await prisma.clearance.findMany({
      where: { applicationId },
      select: {
        id: true,
        officeCode: true,
        officeName: true,
        status: true,
        remarks: true,
        dateCleared: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Get summary stats
    const summary = await getClearanceSummary(applicationId);

    return NextResponse.json(
      {
        message: "Clearances retrieved successfully",
        applicationId,
        applicationNumber: application.applicationNumber,
        applicationType: application.type,
        applicationStatus: application.status,
        clearances,
        summary: {
          requiredOffices: summary.requiredOffices,
          completionPercentage: summary.completionPercentage,
          canProceedToReview: summary.canProceedToReview,
          nextStep: summary.nextStep,
          statusCounts: summary.statusCounts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    captureException(error, {
      route: "GET /api/applications/[id]/clearances",
    });
    console.error("Fetch clearances error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clearances" },
      { status: 500 }
    );
  }
}

// **POST /api/applications/[id]/clearances**
// Initiate clearance workflow — creates clearance packages and changes status to ENDORSED
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only BPLO_OFFICE can initiate clearances (after document verification)
    if (
      session.user.role !== "BPLO_OFFICE"
    ) {
      return NextResponse.json(
        {
          error: "Only BPLO office can initiate clearance workflow",
        },
        { status: 403 }
      );
    }

    const { id: applicationId } = await params;

    // Fetch application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        clearances: {
          select: { id: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Validate application status is SUBMITTED (documents uploaded and ready for clearance)
    if (application.status !== "SUBMITTED") {
      return NextResponse.json(
        {
          error: "Invalid application status",
          message: `Cannot initiate clearance for application in ${application.status} status. Application must be SUBMITTED.`,
        },
        { status: 409 }
      );
    }

    // Check if clearances already initiated
    if (application.clearances.length > 0) {
      return NextResponse.json(
        {
          error: "Clearances already initiated",
          message: "This application already has clearance packages created.",
        },
        { status: 409 }
      );
    }

    // Use transaction for atomicity
    const updated = await prisma.$transaction(async (tx) => {
      // Generate clearance packages (CRITICAL FIX #5: Pass userId for permission check)
      const packages = await generateClearancePackages(applicationId, session.user.id, tx);

      if (packages.length === 0) {
        throw new Error(
          "No clearance offices configured for this application type"
        );
      }

      // Update application status to ENDORSED
      const updatedApp = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: "ENDORSED",
          updatedAt: new Date(),
        },
        select: {
          id: true,
          applicationNumber: true,
          type: true,
          status: true,
          businessName: true,
        },
      });

      // Record in history
      await tx.applicationHistory.create({
        data: {
          applicationId,
          previousStatus: "SUBMITTED",
          newStatus: "ENDORSED",
          comment: "Clearance packages generated and workflow initiated",
          changedBy: session.user.id,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "CLEARANCE_INITIATED",
          entity: "Application",
          entityId: applicationId,
          details: {
            applicationNumber: updatedApp.applicationNumber,
            clearanceCount: packages.length,
            offices: packages.map((p) => p.officeName),
            timestamp: new Date().toISOString(),
          },
        },
      });

      return { updatedApp, packages };
    });

    // Send email to applicant to notify about clearance initiation (non-blocking)
    sendApplicationStatusEmail(
      application.applicant.email,
      application.applicant.firstName || "Applicant",
      updated.updatedApp.applicationNumber,
      "ENDORSED",
      "Your application has been forwarded to required clearance offices for approval."
    ).catch((emailError: unknown) => {
      console.error("Failed to send endorsement email:", emailError);
    });

    // Broadcast SSE event to applicant and reviewers
    broadcastClearanceInitiated(
      application.applicantId,
      applicationId,
      updated.updatedApp.applicationNumber,
      updated.packages.map((p) => p.officeName)
    );

    // Invalidate caches
    await invalidateApplicationCaches(applicationId, session.user.id);

    // Fetch updated context
    const context = await getApplicationContext(applicationId);

    return NextResponse.json(
      {
        message: "Clearance workflow initiated successfully",
        application: context,
        clearances: updated.packages,
        nextSteps: {
          estimatedTime: "3-7 days for all clearances",
          trackingUrl: `/dashboard/applications/${applicationId}`,
          notificationMethod:
            "Email and SMS updates from clearance offices and applicant",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    captureException(error, {
      route: "POST /api/applications/[id]/clearances",
    });
    console.error("Initiate clearance error:", error);

    if (error instanceof Error) {
      if (error.message.includes("already")) {
        return NextResponse.json(
          { error: "Clearances already initiated", message: error.message },
          { status: 409 }
        );
      }
      if (error.message.includes("No clearance offices")) {
        return NextResponse.json(
          { error: "Configuration error", message: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to initiate clearance workflow" },
      { status: 500 }
    );
  }
}
