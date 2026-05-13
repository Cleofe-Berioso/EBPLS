import { NextResponse } from "next/server";
import { requireJitSession } from "@/lib/jit-api";
import { getJitDashboardSummary } from "@/lib/jit-dashboard";

export async function GET() {
  const session = await requireJitSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getJitDashboardSummary();
  return NextResponse.json({ summary });
}