import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { listBploApplications } from "@/lib/bplo-applications";

export async function GET(req: Request) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const applications = await listBploApplications({
    search: searchParams.get("search") ?? undefined,
    type: (searchParams.get("type") as "ALL" | "NEW" | "RENEWAL" | "CLOSURE" | null) ?? "ALL",
    status: (
      searchParams.get("status") as
        | "ALL"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "RETURNED_FOR_CORRECTION"
        | null
    ) ?? "ALL",
  });

  return NextResponse.json({ applications });
}
