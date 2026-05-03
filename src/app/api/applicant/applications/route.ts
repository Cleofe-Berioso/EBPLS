import { NextResponse } from "next/server";
import {
  ApplicantEligibilityError,
  listApplicantApplications,
  saveApplicantApplication,
  SubmitValidationError,
} from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";
import type { SaveApplicationInput } from "@/lib/applicant-types";

function logApplicantApi(event: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[ApplicantApplicationsAPI] ${event}`, data);
  }
}

export async function GET() {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listApplicantApplications(session.user.id);
  return NextResponse.json({ applications: rows });
}

export async function POST(req: Request) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SaveApplicationInput;
  try {
    payload = (await req.json()) as SaveApplicationInput;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!payload?.applicationType || !payload?.formData || !payload?.mode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["NEW", "RENEWAL", "CLOSURE"].includes(payload.applicationType)) {
    return NextResponse.json({ error: "Invalid application type" }, { status: 400 });
  }

  if (!["DRAFT", "SUBMIT"].includes(payload.mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  logApplicantApi("request", {
    userId: session.user.id,
    userEmail: session.user.email ?? null,
    mode: payload.mode,
    applicationType: payload.applicationType,
    applicationId: payload.applicationId ?? null,
  });

  try {
    const saved = await saveApplicantApplication(session.user.id, payload);
    logApplicantApi("success", {
      userId: session.user.id,
      userEmail: session.user.email ?? null,
      applicationId: saved.id,
      applicationNumber: saved.applicationNumber,
      status: saved.status,
      submittedAt: saved.submittedAt,
    });
    return NextResponse.json({ application: saved });
  } catch (error) {
    if (error instanceof SubmitValidationError) {
      return NextResponse.json(
        {
          error: "Application is incomplete. Complete all required fields and documents before submitting.",
          detail: error.detail,
        },
        { status: 400 }
      );
    }

    if (error instanceof ApplicantEligibilityError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unable to save application";
    const status = message === "Application not found" ? 404 : 400;
    logApplicantApi("error", {
      userId: session.user.id,
      userEmail: session.user.email ?? null,
      mode: payload.mode,
      applicationType: payload.applicationType,
      error: message,
      status,
    });
    return NextResponse.json({ error: message }, { status });
  }
}
