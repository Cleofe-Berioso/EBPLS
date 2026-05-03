import { NextResponse } from "next/server";
import { getApplicantApplicationDetail } from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";

interface RouteContext {
  params: Promise<{ applicationId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await context.params;
  const detail = await getApplicantApplicationDetail(session.user.id, applicationId);

  if (!detail) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ application: detail });
}
