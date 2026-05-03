import { NextResponse } from "next/server";
import { requireBploSession } from "@/lib/bplo-api";
import { returnBusinessLocationForCorrection } from "@/lib/business-location";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessLocationId: string }> }
) {
  const session = await requireBploSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { businessLocationId } = await params;

  let payload: { remarks?: unknown } = {};
  try {
    payload = (await req.json()) as { remarks?: unknown };
  } catch {
    payload = {};
  }

  try {
    const row = await returnBusinessLocationForCorrection(
      businessLocationId,
      session.user.id,
      payload.remarks
    );
    return NextResponse.json({ row });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to return business location for correction";

    if (message === "Business location not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
