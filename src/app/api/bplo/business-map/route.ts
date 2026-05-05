import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { listBploBusinessLocations } from "@/lib/business-location";
import type { MapBusinessCategory } from "@/lib/business-map-categories";

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

function parseCategory(value: string | null): "ALL" | MapBusinessCategory {
  if (
    value === "FOOD" ||
    value === "RETAIL" ||
    value === "SERVICES" ||
    value === "INDUSTRIAL" ||
    value === "TRANSPORT" ||
    value === "OTHER"
  ) {
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
    owner: searchParams.get("owner") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    category: parseCategory(searchParams.get("category")),
  });

  return NextResponse.json({ rows });
}
