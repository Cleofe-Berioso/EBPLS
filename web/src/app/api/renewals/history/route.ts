/**
 * GET /api/renewals/history
 * Fetch all RENEWAL type applications for the current user
 *
 * Access: APPLICANT (own renewals only), BPLO_OFFICE (any)
 * Returns: List of renewal applications with status, dates, and permit info
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
    // APPLICANT: only own renewals
    // BPLO_OFFICE: all renewals
    const where: any = {
      type: "RENEWAL", // Only fetch RENEWAL type applications
    };

    if (session.user.role === "APPLICANT") {
      where.applicantId = session.user.id;
    }

    // Fetch renewal applications
    const renewals = await prisma.application.findMany({
      where,
      select: {
        id: true,
        applicationNumber: true,
        previousPermitId: true,
        businessName: true,
        status: true,
        type: true,
        submittedAt: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        createdAt: true,
        applicantId: true,
        previousPermit: {
          select: {
            id: true,
            permitNumber: true,
            expiryDate: true,
          },
        },
        permit: {
          select: {
            id: true,
            permitNumber: true,
            expiryDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response
    const formattedRenewals = renewals.map((renewal) => ({
      id: renewal.id,
      applicationNumber: renewal.applicationNumber,
      previousPermitId: renewal.previousPermitId,
      businessName: renewal.businessName,
      status: renewal.status,
      type: renewal.type,
      submittedAt: renewal.submittedAt?.toISOString() || null,
      approvedAt: renewal.approvedAt?.toISOString() || null,
      rejectedAt: renewal.rejectedAt?.toISOString() || null,
      createdAt: renewal.createdAt.toISOString(),
      rejectionReason: renewal.rejectionReason,
      permit: renewal.permit ? {
        id: renewal.permit.id,
        permitNumber: renewal.permit.permitNumber,
        expiryDate: renewal.permit.expiryDate.toISOString().split("T")[0],
      } : undefined,
    }));

    // Log activity
    if (session.user.role === "APPLICANT") {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: "RENEWAL_HISTORY_VIEWED",
          entity: "Application",
          details: {
            type: "RENEWAL",
            count: renewals.length,
          },
        },
      });
    }

    return NextResponse.json({
      renewals: formattedRenewals,
      total: renewals.length,
      message: `Retrieved ${renewals.length} renewal applications`,
    });
  } catch (error) {
    captureException(error, { route: "GET /api/renewals/history" });
    console.error("Renewal history error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve renewal history" },
      { status: 500 }
    );
  }
}
