import { NextResponse } from "next/server";
import { applyDepartmentHeadRevocationDecision, requireDepartmentHeadSession } from "@/lib/department-head-api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inspectionId } = await params;

  let payload: { remarks?: string } = {};
  try {
    payload = (await req.json()) as { remarks?: string };
  } catch {
    payload = {};
  }

  try {
    const result = await applyDepartmentHeadRevocationDecision(
      inspectionId,
      session.user.id,
      "DENY",
      payload.remarks
    );

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to deny revocation";
    const status =
      message === "Inspection not found"
        ? 404
        : message.includes("required") || message.includes("review") || message.includes("finalized")
          ? 422
          : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
