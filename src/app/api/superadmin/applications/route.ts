import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { listSuperAdminApplications } from "@/lib/superadmin-data";

export async function GET(req: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;

  const applications = await listSuperAdminApplications(search);
  return NextResponse.json({ applications });
}
