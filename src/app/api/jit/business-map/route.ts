import { NextResponse } from "next/server";
import { requireJitSession } from "@/lib/jit-api";
import { listJitBusinessMapLocations } from "@/lib/business-location";

function parseType(value: string | null): "ALL" | "NEW" | "RENEWAL" {
  if (value === "NEW" || value === "RENEWAL") {
    return value;
  }

  return "ALL";
}

export async function GET(req: Request) {
  const session = await requireJitSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rows = await listJitBusinessMapLocations({
    type: parseType(searchParams.get("type")),
    owner: searchParams.get("owner") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  return NextResponse.json({ rows });
}
