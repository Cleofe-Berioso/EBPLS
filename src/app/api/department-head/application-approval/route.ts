import { NextResponse } from "next/server";
import { requireDepartmentHeadSession, listDepartmentHeadApprovalQueue } from "@/lib/department-head-api";

export async function GET() {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listDepartmentHeadApprovalQueue();
  return NextResponse.json({ rows });
}