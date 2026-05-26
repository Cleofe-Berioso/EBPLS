import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { listSuperAdminActivities } from "@/lib/superadmin-data";

type ActivityActorRole = "ALL" | "APPLICANT" | "BPLO" | "DEPARTMENT_HEAD" | "JIT" | "SUPER_ADMIN" | "SYSTEM";

function parseActorRole(raw: string | null): ActivityActorRole | null {
  if (!raw || raw === "") return "ALL";
  if (
    raw === "ALL" ||
    raw === "APPLICANT" ||
    raw === "BPLO" ||
    raw === "DEPARTMENT_HEAD" ||
    raw === "JIT" ||
    raw === "SUPER_ADMIN" ||
    raw === "SYSTEM"
  ) {
    return raw;
  }
  return null;
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
}

export async function GET(req: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const actorRole = parseActorRole(searchParams.get("actorRole"));
  if (!actorRole) {
    return NextResponse.json({ error: "Invalid actorRole filter" }, { status: 400 });
  }
  const searchKeyword = searchParams.get("search") ?? undefined;
  const module = searchParams.get("module") ?? undefined;
  const action = searchParams.get("action") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const applicationNumber = searchParams.get("applicationNumber") ?? undefined;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 25);

  const activities = await listSuperAdminActivities({
    searchKeyword,
    actorRole,
    module,
    action,
    dateFrom,
    dateTo,
    applicationNumber,
    page,
    pageSize,
  });

  return NextResponse.json(activities);
}
