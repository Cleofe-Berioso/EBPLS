import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { listAssessmentFeeApplications } from "@/lib/bplo-assessment";

export async function GET() {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listAssessmentFeeApplications();
  return NextResponse.json({ rows });
}
