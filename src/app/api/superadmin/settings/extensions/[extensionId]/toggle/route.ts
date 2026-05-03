import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { toggleRenewalExtension } from "@/lib/fee-settings";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ extensionId: string }> }
) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { extensionId } = await params;
  if (!extensionId) {
    return NextResponse.json({ error: "Extension ID is required." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { isActive } = body as Record<string, unknown>;
  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be true or false." }, { status: 400 });
  }

  try {
    const extension = await toggleRenewalExtension({
      extensionId,
      isActive,
      updatedById: session.user.id,
    });

    return NextResponse.json({ success: true, extension });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update extension status." }, { status: 500 });
  }
}
