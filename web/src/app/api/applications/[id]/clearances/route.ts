/**
 * GET /api/applications/[id]/clearances
 * POST /api/applications/[id]/clearances
 * BPLO-managed requirement tracking routes.
 *
 * GET: List all requirement tracking items for an application
 * POST: Initialize requirement tracking (transition app to UNDER_REVIEW)
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
// Fetch BPLO-managed requirement tracking items for an application
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

    // Authorization: applicant can only see their own, BPLO/ADMIN can see all
    if (
      session.user.role === "APPLICANT" &&
      application.applicantId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all tracked requirements for this application
    const clearances = await prisma.clearance.findMany({
      where: { applicationId },
      select: {
        id: true,
        requirementCode: true,
        requirementName: true,
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
        message: "Requirement tracking retrieved successfully",
        applicationId,
        applicationNumber: application.applicationNumber,
        applicationType: application.type,
        applicationStatus: application.status,
        clearances,
        summary: {
          requiredRequirements: summary.requiredOffices,
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
    console.error("Fetch requirement tracking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch requirement tracking" },
      { status: 500 }
    );
  }
}

// **POST /api/applications/[id]/clearances**
// Initialize BPLO-managed requirement tracking and transition application to UNDER_REVIEW
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
      return NextResponse.json(
        {
          error: "Only BPLO office can initialize requirement tracking",
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

    // Validate application status is SUBMITTED before review begins
    if (application.status !== "SUBMITTED") {
      return NextResponse.json(
        {
          error: "Invalid application status",
          message: `Cannot initialize requirement tracking for application in ${application.status} status. Application must be SUBMITTED.`,
        },
        { status: 409 }
      );
    }

    // Check if requirement tracking already exists
    if (application.clearances.length > 0) {
      return NextResponse.json(
        {
          error: "Requirements already initialized",
          message: "This application already has BPLO-managed requirement tracking records.",
        },
        { status: 409 }
      );
    }

    // Use transaction for atomicity
    const updated = await prisma.$transaction(async (tx) => {
      // Generate requirement tracking records (CRITICAL FIX #5: Pass userId for permission check)
      const packages = await generateClearancePackages(applicationId, session.user.id, tx);

      if (packages.length === 0) {
        throw new Error(
          "No requirement labels configured for this application type"
        );
      }

      // Update application status to UNDER_REVIEW
      const updatedApp = await tx.application.update({
        where: { id: applicationId },
        data: {
          status: "UNDER_REVIEW",
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
          newStatus: "UNDER_REVIEW",
          comment: "BPLO-managed requirement tracking initialized",
          changedBy: session.user.id,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "REQUIREMENTS_INITIALIZED",
          entity: "Application",
          entityId: applicationId,
          details: {
            applicationNumber: updatedApp.applicationNumber,
            requirementCount: packages.length,
            requirements: packages.map((p) => p.requirementName),
            timestamp: new Date().toISOString(),
          },
        },
      });

      return { updatedApp, packages };
    });

    // Send email to applicant to notify about review handoff (non-blocking)
    sendApplicationStatusEmail(
      application.applicant.email,
      application.applicant.firstName || "Applicant",
      updated.updatedApp.applicationNumber,
      "UNDER_REVIEW",
      "Your application has been forwarded to BPLO review and requirement validation."
    ).catch((emailError: unknown) => {
      console.error("Failed to send requirement tracking email:", emailError);
    });

    // Broadcast SSE event to applicant and reviewers
    broadcastClearanceInitiated(
      application.applicantId,
      applicationId,
      updated.updatedApp.applicationNumber,
      updated.packages.map((p) => p.requirementName)
    );

    // Invalidate caches
    await invalidateApplicationCaches(applicationId, session.user.id);

    // Fetch updated context
    const context = await getApplicationContext(applicationId);

    return NextResponse.json(
      {
        message: "Requirement tracking initialized successfully",
        application: context,
        clearances: updated.packages,
        nextSteps: {
          estimatedTime: "3-7 days for BPLO review and requirement validation",
          trackingUrl: `/dashboard/applications/${applicationId}`,
          notificationMethod:
            "Email and in-app updates from BPLO",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    captureException(error, {
      route: "POST /api/applications/[id]/clearances",
    });
    console.error("Initialize requirement tracking error:", error);

    if (error instanceof Error) {
      if (error.message.includes("already")) {
        return NextResponse.json(
          { error: "Requirements already initialized", message: error.message },
          { status: 409 }
        );
      }
      if (error.message.includes("No requirement labels")) {
        return NextResponse.json(
          { error: "Configuration error", message: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to initialize requirement tracking" },
      { status: 500 }
    );
  }
}
