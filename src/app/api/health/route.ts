import { NextResponse } from "next/server";

/** Lightweight liveness probe for Render — no database access. */
export async function GET() {
  return NextResponse.json({ ok: true, service: "ebpls" });
}
