import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { getSuperAdminDashboardSummary } from "@/lib/superadmin-data";

export async function GET() {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getSuperAdminDashboardSummary();
  return NextResponse.json({ summary });
}
