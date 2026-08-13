import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { listSuperAdminActivities } from "@/lib/superadmin-data";

type ActivityActorRole = "ALL" | "APPLICANT" | "BPLO" | "DEPARTMENT_HEAD" | "JIT" | "SUPER_ADMIN" | "SYSTEM";

function sanitizeFilterText(raw: string | null, maxLength = 100): string | undefined {
  if (!raw) return undefined;

  const trimmed = raw.trim().replace(/\0/g, "");
  if (!trimmed) return undefined;

  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

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
  const searchKeyword = sanitizeFilterText(searchParams.get("search"), 120);
  const auditModule = sanitizeFilterText(searchParams.get("module"), 80);
  const action = sanitizeFilterText(searchParams.get("action"), 80);
  const dateFrom = sanitizeFilterText(searchParams.get("dateFrom"), 20);
  const dateTo = sanitizeFilterText(searchParams.get("dateTo"), 20);
  const applicationNumber = sanitizeFilterText(searchParams.get("applicationNumber"), 100);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 25);

  const activities = await listSuperAdminActivities({
    searchKeyword,
    actorRole,
    module: auditModule,
    action,
    dateFrom,
    dateTo,
    applicationNumber,
    page,
    pageSize,
  });

  return NextResponse.json(activities);
}
