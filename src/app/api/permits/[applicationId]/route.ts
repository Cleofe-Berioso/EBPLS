import { NextResponse } from "next/server";
import { requireApplicantSession } from "@/lib/applicant-api";
import { getApplicantBusinessPermitPrintAccess } from "@/lib/printable-documents";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await requireApplicantSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;
  const access = await getApplicantBusinessPermitPrintAccess(applicationId, session.user.id);

  if (access.ok === false) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  return NextResponse.json({ permit: access.permit });
}
