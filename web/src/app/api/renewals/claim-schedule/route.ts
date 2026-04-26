/**
 * GET /api/renewals/claim-schedule
 * DEPRECATED: Claim scheduling feature removed in 3-role refactoring
 * Kept for backwards compatibility, returns empty response
 *
 * Access: APPLICANT (own schedules), BPLO_OFFICE (any)
 * Returns: Empty appointment data (feature disabled)
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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

    // Claim scheduling has been removed
    return NextResponse.json({
      upcomingAppointment: null,
      pastAppointments: [],
      availableSlots: 0,
      message: "Claim schedule feature has been disabled",
    });
  } catch (error) {
    console.error("Claim schedule error:", error);

    return NextResponse.json(
      { error: "Failed to retrieve claim schedule" },
      { status: 500 }
    );
  }
}
