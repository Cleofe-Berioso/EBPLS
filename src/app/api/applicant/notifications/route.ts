import { NextResponse } from "next/server";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";
import { listApplicantNotifications } from "@/lib/applications";
import { safeApiErrorMessage } from "@/lib/api-errors";

export async function GET(req: Request) {
  const authContext = await resolveApplicantSessionContext();
  if (!authContext.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ?? undefined;
    const pageSize = searchParams.get("pageSize") ?? undefined;

    const result = await listApplicantNotifications(authContext.applicantId, { page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: safeApiErrorMessage(error, "Unable to load notifications") }, { status: 500 });
  }
}
