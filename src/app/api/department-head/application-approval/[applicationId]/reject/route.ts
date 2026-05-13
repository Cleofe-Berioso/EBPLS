import { NextResponse } from "next/server";
import { applyDepartmentHeadAction, requireDepartmentHeadSession } from "@/lib/department-head-api";

interface RouteContext {
  params: Promise<{ applicationId: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  const session = await requireDepartmentHeadSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { remarks?: string };
  try {
    payload = (await req.json()) as { remarks?: string };
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const { applicationId } = await context.params;
    const application = await applyDepartmentHeadAction(
      applicationId,
      session.user.id,
      "REJECT",
      payload.remarks
    );
    return NextResponse.json({ application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reject application";
    const status =
      message === "Application not found"
        ? 404
        : message === "Application is not in Department Head review stage"
          ? 409
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}