import { NextResponse } from "next/server";
import { listDepartmentHeadInspectionVerificationQueue, requireDepartmentHeadSession } from "@/lib/department-head-api";

export async function GET() {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listDepartmentHeadInspectionVerificationQueue();
  return NextResponse.json({ rows });
}