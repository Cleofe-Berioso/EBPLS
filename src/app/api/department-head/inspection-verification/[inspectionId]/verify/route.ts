import { NextResponse } from "next/server";
import { applyDepartmentHeadInspectionVerification, requireDepartmentHeadSession } from "@/lib/department-head-api";
import { logInspectionAction } from "@/lib/audit-log";

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
    const result = await applyDepartmentHeadInspectionVerification(inspectionId, session.user.id, payload.remarks);
    // Audit: Inspection verified
    void logInspectionAction(
      session.user.id,
      session.user.name ?? session.user.email ?? null,
      "DEPARTMENT_HEAD",
      result.inspectionId,
      null,
      result.applicationId ?? null,
      "VERIFIED",
      "DH_VERIFICATION_PENDING",
      payload.remarks === "COMPLIANT" ? "VERIFIED_COMPLIANT" : "VERIFIED_NON_COMPLIANT",
      payload.remarks as any,
      `Inspection verified as ${payload.remarks}: ${payload.remarks || "No remarks"}`,
      { remarks: payload.remarks }
    );

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify inspection";
    const status =
      message === "Inspection not found"
        ? 404
        : message.includes("required") || message.includes("pending") || message.includes("cannot") || message.includes("released") || message.includes("active")
          ? 422
          : 400;

    return NextResponse.json({ error: message }, { status });
  }
}