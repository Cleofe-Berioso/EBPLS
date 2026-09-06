import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import {
  requireDepartmentHeadSession,
  listDepartmentHeadApprovalQueuePaginated,
} from "@/lib/department-head-api";

export async function GET(req: Request) {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ?? undefined;
    const pageSize = searchParams.get("pageSize") ?? undefined;
    const result = await listDepartmentHeadApprovalQueuePaginated({ page, pageSize });
    return NextResponse.json({
      rows: result.records,
      ...result,
    });
  } catch (error) {
    console.error("[department-head/application-approval] failed to load queue", error);
    return NextResponse.json(
      { error: safeApiErrorMessage(error, "Unable to load Department Head review queue") },
      { status: 500 }
    );
  }
}
