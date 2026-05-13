import { NextResponse } from "next/server";
import { requireApplicantSession } from "@/lib/applicant-api";
import { submitApplicantBusinessLocation } from "@/lib/business-location";

/**
 * DEPRECATED (Phase 7): This endpoint is no longer used.
 * Business Location is now integrated into the application form submission flow.
 * Coordinates are submitted and persisted via the application form, not via this standalone API.
 * Kept for historical reference only; safe to remove in a future cleanup.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessRecordId: string }> }
) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { businessRecordId } = await params;

  let payload: {
    latitude?: unknown;
    longitude?: unknown;
    address?: unknown;
    barangay?: unknown;
  } = {};

  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    payload = {};
  }

  try {
    const record = await submitApplicantBusinessLocation(session.user.id, businessRecordId, {
      latitude: payload.latitude,
      longitude: payload.longitude,
      address: payload.address,
      barangay: payload.barangay,
    });

    return NextResponse.json({ record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit business location";

    if (message === "Released business record not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (
      message.includes("latitude") ||
      message.includes("longitude") ||
      message.includes("businessLocationAddress") ||
      message.includes("Verified location")
    ) {
      return NextResponse.json({ error: message }, { status: 422 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
