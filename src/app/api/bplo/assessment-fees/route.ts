import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { listAssessmentFeeApplicationsPaginated } from "@/lib/bplo-assessment";

export async function GET(req: Request) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? undefined;
  const pageSize = searchParams.get("pageSize") ?? undefined;
  const result = await listAssessmentFeeApplicationsPaginated({ page, pageSize });

  return NextResponse.json({
    rows: result.records,
    ...result,
  });
}
