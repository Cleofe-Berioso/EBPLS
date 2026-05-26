import { NextResponse } from "next/server";
import { requireApplicantSession } from "@/lib/applicant-api";
import { listApplicantReleasedBusinessLocations } from "@/lib/business-location";

/**
 * DEPRECATED (Phase 7): This endpoint is no longer used.
 * Business Location is now integrated into the application form submission flow.
 * Coordinates are submitted and persisted via the application form, not via this standalone API.
 * Kept for historical reference only; safe to remove in a future cleanup.
 */
export async function GET() {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await listApplicantReleasedBusinessLocations(session.user.id);
  return NextResponse.json({ records });
}
