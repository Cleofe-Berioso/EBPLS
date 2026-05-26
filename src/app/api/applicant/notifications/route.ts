import { NextResponse } from "next/server";
import { listApplicantNotifications } from "@/lib/applications";
import { requireApplicantSession } from "@/lib/applicant-api";

export async function GET() {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await listApplicantNotifications(session.user.id);
  return NextResponse.json({ notifications });
}
