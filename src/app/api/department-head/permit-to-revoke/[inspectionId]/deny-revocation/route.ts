import { NextResponse } from "next/server";
import { logRevocationAction } from "@/lib/audit-log";
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


    // Audit: Revocation denied
    void logRevocationAction(
      session.user.id,
      session.user.name ?? session.user.email ?? null,
      "DEPARTMENT_HEAD",
      result.inspectionId,
      result.applicationId,
      "DENIED",
      payload.remarks,
      "DENIED",
      `Revocation denied: ${payload.remarks || "No remarks"}`,
      { remarks: payload.remarks }
    );

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to deny revocation";
    const status =
      message === "Inspection not found"
        ? 404
        : message.includes("required") || message.includes("review") || message.includes("finalized") || message.includes("verified")
          ? 422
          : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
