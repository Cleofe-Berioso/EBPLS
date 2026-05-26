import { NextResponse } from "next/server";
import { listApplicantDocuments } from "@/lib/applications";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";

interface RouteContext {
  params: Promise<{ applicationId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  try {
    const { applicationId } = await context.params;
    const documents = await listApplicantDocuments(authContext.applicantId, applicationId);
    return NextResponse.json({ documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load documents";
    const status = message === "Application not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request, context: RouteContext) {
  const authContext = await resolveApplicantSessionContext();
  if (authContext.ok === false) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }
  void req;
  void context;
  return NextResponse.json(
    {
      error:
        "Upload files only during final submit. Per-document upload before submit is disabled.",
    },
    { status: 400 }
  );
}
