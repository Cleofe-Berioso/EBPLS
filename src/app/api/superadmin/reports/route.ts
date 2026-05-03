import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { getSuperAdminReportsSummary } from "@/lib/superadmin-data";

export async function GET() {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await getSuperAdminReportsSummary();
  return NextResponse.json({ reports });
}
