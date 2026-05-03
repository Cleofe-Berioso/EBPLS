import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { listSuperAdminActivities } from "@/lib/superadmin-data";

export async function GET(req: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const actorRole =
    (searchParams.get("actorRole") as "ALL" | "APPLICANT" | "BPLO" | "SUPER_ADMIN" | null) ??
    "ALL";
  const transition = searchParams.get("transition") ?? undefined;
  const date = searchParams.get("date") ?? undefined;
  const applicationNumber = searchParams.get("applicationNumber") ?? undefined;

  const activities = await listSuperAdminActivities({
    actorRole,
    transition,
    date,
    applicationNumber,
  });

  return NextResponse.json({ activities });
}
