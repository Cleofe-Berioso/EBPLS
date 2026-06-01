import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
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
    const message = error instanceof Error ? error.message : "";

    if (message === "Business location not found") {
      return NextResponse.json(
        { error: safeApiErrorMessage(error, "Business location not found") },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: safeApiErrorMessage(error, "Unable to return business location for correction") },
      { status: 422 }
    );
  }
}
