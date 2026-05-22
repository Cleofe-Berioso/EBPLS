import { NextResponse } from "next/server";
import { getApplicantApplicationDetail, saveApplicantApplication } from "@/lib/applications";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";
import type { SaveApplicationInput } from "@/lib/applicant-types";

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

export async function PATCH(req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  const { applicationId } = await context.params;

  let payload: SaveApplicationInput;
  try {
    payload = (await req.json()) as SaveApplicationInput;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!payload?.applicationType || !payload?.formData || !payload?.mode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const saved = await saveApplicantApplication(authContext.applicantId, {
      ...payload,
      applicationId,
    });

    return NextResponse.json({ application: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save application";
    const status = message === "Application not found" ? 404 : message.includes("locked for review") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
