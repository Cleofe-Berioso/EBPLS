import { NextResponse } from "next/server";
import {
  listDepartmentHeadInspectionVerificationQueuePaginated,
  requireDepartmentHeadSession,
} from "@/lib/department-head-api";

export async function GET(req: Request) {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? undefined;
  const pageSize = searchParams.get("pageSize") ?? undefined;
  const result = await listDepartmentHeadInspectionVerificationQueuePaginated({ page, pageSize });

  return NextResponse.json({
    rows: result.records,
    ...result,
  });
}
