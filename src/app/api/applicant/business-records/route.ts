import { NextResponse } from "next/server";
import { listApplicantBusinessRecords } from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";

export async function GET() {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await listApplicantBusinessRecords(session.user.id);
  // Renewal candidates: active and not revoked.
  const records = all.filter((r: any) => r.businessStatus === "ACTIVE" && !r.hasRevokedPermit);
  const revokedBlockedCount = all.filter(
    (r: any) => r.businessStatus === "INACTIVE" || r.hasRevokedPermit
  ).length;

  return NextResponse.json({ records, revokedBlockedCount });
}
