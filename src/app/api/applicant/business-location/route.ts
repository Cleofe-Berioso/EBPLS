import { NextResponse } from "next/server";
import { requireApplicantSession } from "@/lib/applicant-api";
import { listApplicantReleasedBusinessLocations } from "@/lib/business-location";

export async function GET() {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await listApplicantReleasedBusinessLocations(session.user.id);
  return NextResponse.json({ records });
}
