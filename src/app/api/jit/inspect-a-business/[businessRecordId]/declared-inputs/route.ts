import { NextResponse } from "next/server";
import { safeApiErrorMessage } from "@/lib/api-errors";
import { requireJitSession } from "@/lib/jit-api";
import { getJitDeclaredInputs } from "@/lib/jit-declared-inputs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessRecordId: string }> }
) {
  const session = await requireJitSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { businessRecordId } = await params;
    const declaredInputs = await getJitDeclaredInputs(businessRecordId);
    return NextResponse.json({ declaredInputs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status =
      message === "Business record not found" || message === "Only active released businesses can be inspected"
        ? 404
        : 400;
    return NextResponse.json(
      { error: safeApiErrorMessage(error, "Unable to load declared inputs") },
      { status }
    );
  }
}
