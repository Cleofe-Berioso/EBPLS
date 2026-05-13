import { NextResponse } from "next/server";
import { requireDepartmentHeadSession } from "@/lib/department-head-api";
import { getDepartmentHeadDashboardSummary } from "@/lib/department-head-dashboard";

export async function GET() {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getDepartmentHeadDashboardSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to fetch dashboard summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
