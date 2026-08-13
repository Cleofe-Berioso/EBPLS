import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { listSuperAdminApplications } from "@/lib/superadmin-data";

export async function GET(req: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const page = searchParams.get("page") ?? undefined;
  const pageSize = searchParams.get("pageSize") ?? undefined;

  const result = await listSuperAdminApplications(search, { page, pageSize });
  return NextResponse.json({ applications: result.records, pagination: result });
}
