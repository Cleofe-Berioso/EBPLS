import { NextRequest, NextResponse } from "next/server";
import { listApplicantBusinessRecords } from "@/lib/applications";
import { listRenewalEligibleBusinesses } from "@/lib/renewal-eligibility";
import { listClosureEligibleBusinesses } from "@/lib/closure-eligibility";
import { requireApplicantSession } from "@/lib/applicant-api";

export async function GET(request: NextRequest) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applicationType = request.nextUrl.searchParams.get("applicationType");

  if (applicationType === "RENEWAL") {
    const renewal = await listRenewalEligibleBusinesses(session.user.id);
    return NextResponse.json({
      records: renewal.records,
      blockedRecords: renewal.blockedRecords,
      revokedBlockedCount: renewal.blockedRecords.length,
    });
  }

  if (applicationType === "CLOSURE") {
    const closure = await listClosureEligibleBusinesses(session.user.id);
    return NextResponse.json({
      records: closure.records,
      complianceForcedRecords: closure.complianceForcedRecords,
    });
  }

  const all = await listApplicantBusinessRecords(session.user.id);
  // Renewal candidates: active and not revoked.
  const records = all.filter((r: any) => r.businessStatus === "ACTIVE" && !r.hasRevokedPermit);
  const revokedBlockedCount = all.filter(
    (r: any) => r.businessStatus === "INACTIVE" || r.hasRevokedPermit
  ).length;

  return NextResponse.json({ records, revokedBlockedCount });
}
