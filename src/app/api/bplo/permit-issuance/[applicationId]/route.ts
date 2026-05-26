import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { getPermitIssuanceDetail } from "@/lib/bplo-permit-issuance";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;
  const detail = await getPermitIssuanceDetail(applicationId);

  if (!detail) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ detail });
}
