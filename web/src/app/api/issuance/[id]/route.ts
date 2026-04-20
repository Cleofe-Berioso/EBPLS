import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { broadcastNotification, sseBroadcaster, createSSEEvent } from "@/lib/sse";
import { captureException } from "@/lib/monitoring";
import { issuanceUpdateSchema } from "@/lib/validations";

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

    // Validate request body against schema
    const validation = issuanceUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { action, staffNotes, mayorSignedBy, remarks } = validation.data;

    const issuance = await prisma.permitIssuance.findUnique({
      where: { id },
      include: {
        permit: {
          include: {
            application: { select: { applicantId: true } },
          },
        },
      },
    });

    if (!issuance) {
      return NextResponse.json(
        { error: "Issuance record not found" },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      // P7.2: Mayor Signing Actions (offline process tracked in system)
      case "READY_FOR_MAYOR":
        // Mark permit as ready for Mayor signing (prepare printed permit)
        updateData = {
          status: "PREPARED",
          mayorSigningStatus: "PENDING",
          staffNotes: staffNotes || null,
        };
        break;
      case "MAYOR_SIGNED":
        // Mark permit as signed by Mayor (after offline signing)
        // Requires mayorSignedBy (name/title) in request body
        const { mayorSignedBy } = body;
        if (!mayorSignedBy) {
          return NextResponse.json(
            { error: "mayorSignedBy is required for MAYOR_SIGNED action" },
            { status: 400 }
          );
        }
        updateData = {
          mayorSigningStatus: "SIGNED",
          mayorSignedAt: new Date(),
          mayorSignedBy,
          staffNotes: staffNotes || null,
        };
        break;
      case "MAYOR_HELD":
        // Mark permit as held by Mayor (e.g., needs correction)
        // Requires remarks in body
        const { remarks } = body;
        updateData = {
          mayorSigningStatus: "HELD",
          mayorSigningRemarks: remarks || "Held by Mayor - action pending",
          staffNotes: staffNotes || null,
        };
        break;
      case "MAYOR_RETURNED":
        // Mark permit as returned by Mayor (e.g., rejected, needs resubmission)
        updateData = {
          mayorSigningStatus: "NOT_REQUIRED", // Reset for re-preparation if needed
          status: "PREPARED",
          mayorSigningRemarks: body.remarks || "Returned by Mayor",
          staffNotes: staffNotes || null,
        };
        break;

      // Issuance workflow actions (require Mayor signature first if applicable)
      case "ISSUE":
        // Verify Mayor signature if applicable (NEW/RENEWAL)
        if (
          issuance.mayorSigningStatus === "PENDING" ||
          issuance.mayorSigningStatus === "HELD"
        ) {
          return NextResponse.json(
            {
              error: "Cannot issue permit",
              message:
                "Permit awaits Mayor signature. Please complete Mayor signing before issuing.",
            },
            { status: 409 }
          );
        }
        updateData = {
          status: "ISSUED",
          issuedAt: new Date(),
          staffNotes: staffNotes || null,
        };
        break;
      case "RELEASE":
        updateData = {
          status: "RELEASED",
          releasedAt: new Date(),
          staffNotes: staffNotes || issuance.staffNotes,
        };
        break;
      case "COMPLETE":
        updateData = {
          status: "COMPLETED",
          completedAt: new Date(),
          staffNotes: staffNotes || issuance.staffNotes,
        };
        break;
      default:
        return NextResponse.json(
          {
            error: "Invalid action",
            message:
              "Use: READY_FOR_MAYOR, MAYOR_SIGNED, MAYOR_HELD, MAYOR_RETURNED, ISSUE, RELEASE, COMPLETE",
          },
          { status: 400 }
        );
    }

    const updated = await prisma.permitIssuance.update({
      where: { id },
      data: updateData,
    });    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: `ISSUANCE_${action}`,
        entity: "PermitIssuance",
        entityId: id,
        details: {
          permitNumber: issuance.permit.permitNumber,
          action,
        },
      },
    });

    // Broadcast real-time permit_issued event to the applicant when permit is ISSUED (non-blocking)
    if (action === "ISSUE" || action === "RELEASE") {
      const applicantId = issuance.permit.application.applicantId;
      try {
        sseBroadcaster.sendToUser(
          applicantId,
          createSSEEvent("permit_issued", {
            issuanceId: id,
            permitNumber: issuance.permit.permitNumber,
            action,
          }, applicantId)
        );
      } catch (error) {
        console.error("Failed to broadcast permit issued event:", error);
      }

      try {
        broadcastNotification(
          applicantId,
          action === "ISSUE" ? "Permit Ready for Claiming" : "Permit Released",
          action === "ISSUE"
            ? `Your permit #${issuance.permit.permitNumber} is ready. Please schedule your claiming appointment.`
            : `Your permit #${issuance.permit.permitNumber} has been released.`,
          "/dashboard/claim-reference"
        );
      } catch (error) {
        console.error("Failed to broadcast issuance notification:", error);
      }
    }

    return NextResponse.json({
      message: `Permit issuance ${action.toLowerCase()} successfully`,
      issuance: updated,
    });  } catch (error) {
    captureException(error, { route: 'POST /api/issuance/[id]' });
    console.error("Update issuance error:", error);
    return NextResponse.json(
      { error: "Failed to update issuance" },
      { status: 500 }
    );
  }
}
