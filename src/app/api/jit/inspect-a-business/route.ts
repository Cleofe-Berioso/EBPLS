import { NextResponse } from "next/server";
import { requireJitSession } from "@/lib/jit-api";
import { listJitInspectableBusinesses } from "@/lib/jit-inspections";

export async function GET() {
  const session = await requireJitSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listJitInspectableBusinesses();
  return NextResponse.json({ rows });
}
