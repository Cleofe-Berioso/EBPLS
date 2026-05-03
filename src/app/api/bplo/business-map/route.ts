import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { listBploBusinessLocations } from "@/lib/business-location";

function parseType(value: string | null): "ALL" | "NEW" | "RENEWAL" | "CLOSURE" {
  if (value === "NEW" || value === "RENEWAL" || value === "CLOSURE") {
    return value;
  }

  return "ALL";
}

function parseStatus(
  value: string | null
): "ALL" | "PENDING" | "VERIFIED" | "NEEDS_CORRECTION" {
  if (value === "PENDING" || value === "VERIFIED" || value === "NEEDS_CORRECTION") {
    return value;
  }

  return "ALL";
}

export async function GET(req: Request) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rows = await listBploBusinessLocations({
    type: parseType(searchParams.get("type")),
    status: parseStatus(searchParams.get("status")),
  });

  return NextResponse.json({ rows });
}
