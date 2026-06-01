import { NextResponse } from "next/server";
import { listApplicantNotifications } from "@/lib/applications";
import { resolveApplicantSessionContext } from "@/lib/applicant-api";

export async function GET() {
  try {
    const authContext = await resolveApplicantSessionContext();
    if (authContext.ok === false) {
      return NextResponse.json({ notifications: [] }, { status: 200 });
    }

    const notifications = await listApplicantNotifications(authContext.applicantId);
    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[GET /api/applicant/notifications] Error:", err);
    return NextResponse.json(
      { error: "Failed to load notifications", notifications: [] },
      { status: 500 }
    );
  }
}
