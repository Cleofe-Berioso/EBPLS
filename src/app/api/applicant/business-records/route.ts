import { NextResponse } from "next/server";
import { listApplicantBusinessRecords } from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";

export async function GET() {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await listApplicantBusinessRecords(session.user.id);
  // Return only ACTIVE business records for the application form selector.
  // Closed businesses are hidden here so they cannot be selected for renewal or new closure.
  const records = all.filter((r) => r.businessStatus === "ACTIVE");
  return NextResponse.json({ records });
}
