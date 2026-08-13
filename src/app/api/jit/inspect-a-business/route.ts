import { NextResponse } from "next/server";
import { requireJitSession } from "@/lib/jit-api";
import { listJitInspectableBusinessesPaginated } from "@/lib/jit-inspections";

export async function GET(req: Request) {
  const session = await requireJitSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const page = searchParams.get("page") ?? undefined;
  const pageSize = searchParams.get("pageSize") ?? undefined;

  const result = await listJitInspectableBusinessesPaginated({ search, page, pageSize });
  return NextResponse.json(result);
}
