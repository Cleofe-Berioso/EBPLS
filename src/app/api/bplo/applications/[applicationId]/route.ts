import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { getBploApplicationDetail } from "@/lib/bplo-applications";

interface RouteContext {
  params: Promise<{ applicationId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await context.params;
  const application = await getBploApplicationDetail(applicationId);

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ application });
}
