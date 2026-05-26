import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { getSuperAdminUserSummary, listSuperAdminUsers } from "@/lib/superadmin-data";

export async function GET(req: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const role =
    (searchParams.get("role") as "ALL" | "APPLICANT" | "BPLO" | "SUPER_ADMIN" | "DEPARTMENT_HEAD" | "JIT" | null) ??
    "ALL";
  const status = (searchParams.get("status") as "ALL" | "ACTIVE" | "DISABLED" | null) ?? "ALL";

  const [users, summary] = await Promise.all([
    listSuperAdminUsers({ search, role, status }),
    getSuperAdminUserSummary(),
  ]);

  return NextResponse.json({ users, summary });
}
