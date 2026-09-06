import { NextRequest, NextResponse } from "next/server";
import { applyDepartmentHeadSettlement, requireDepartmentHeadSession } from "@/lib/department-head-api";
import { safeApiErrorMessage } from "@/lib/api-errors";

const SETTLEMENT_SAFE_MESSAGES = [
  "Settlement remarks are required",
  "Inspection not found",
  "Only government-agency-related cases can be settled here",
  "Only MINOR or MAJOR cases can be settled through this action",
  "Case is not in FLAGGED_UNSETTLED status",
  "Case is already settled",
  "Forced closure cases cannot be settled here",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inspectionId: string }> }
) {
  const session = await requireDepartmentHeadSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inspectionId } = await params;
  const body = await req.json().catch(() => ({}));
  const settlementRemarks = typeof body.settlementRemarks === "string" ? body.settlementRemarks : undefined;

  try {
    const result = await applyDepartmentHeadSettlement(inspectionId, session.user.id, settlementRemarks);
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const status = message === "Inspection not found" ? 404 : 400;
    const known = SETTLEMENT_SAFE_MESSAGES.find((item) => message === item);
    return NextResponse.json(
      {
        error:
          known ??
          safeApiErrorMessage(err, "Unable to settle case"),
      },
      { status }
    );
  }
}
