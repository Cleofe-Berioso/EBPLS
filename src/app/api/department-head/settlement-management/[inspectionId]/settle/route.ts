import { NextRequest, NextResponse } from "next/server";
import { applyDepartmentHeadSettlement, requireDepartmentHeadSession } from "@/lib/department-head-api";

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
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unable to settle case" }, { status: 400 });
  }
}
