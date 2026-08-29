import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import { requireDepartmentHeadSession, listDepartmentHeadApprovalQueue } from "@/lib/department-head-api";

export async function GET() {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await listDepartmentHeadApprovalQueue();
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("[department-head/application-approval] failed to load queue", error);
    return NextResponse.json(
      { error: safeApiErrorMessage(error, "Unable to load Department Head review queue") },
      { status: 500 }
    );
  }
}