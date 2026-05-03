import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { releasePermitIssuance } from "@/lib/bplo-permit-issuance";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;

  let payload: { remarks?: string } = {};
  try {
    payload = (await req.json()) as { remarks?: string };
  } catch {
    payload = {};
  }

  try {
    const result = await releasePermitIssuance(
      applicationId,
      session.user.id,
      payload.remarks
    );
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to release permit issuance";
    const status = message === "Application not found" ? 404 : 422;
    return NextResponse.json({ error: message }, { status });
  }
}
