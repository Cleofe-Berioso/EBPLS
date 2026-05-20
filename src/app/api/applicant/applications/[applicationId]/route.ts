import { NextResponse } from "next/server";
import { getApplicantApplicationDetail } from "@/lib/applications";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";

interface RouteContext {
  params: Promise<{ applicationId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  const { applicationId } = await context.params;
  const detail = await getApplicantApplicationDetail(authContext.applicantId, applicationId);

  if (!detail) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ application: detail });
}
