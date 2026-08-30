import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { createRenewalExtension, listRenewalExtensions } from "@/lib/fee-settings";

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET() {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const extensions = await listRenewalExtensions();
  return NextResponse.json({ extensions });
}

export async function POST(req: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { startDate, endDate, isActive, waiveSurcharge, waiveInterest } = body as Record<string, unknown>;

  const parsedStart = parseDate(startDate);
  const parsedEnd = parseDate(endDate);
  if (!parsedStart || !parsedEnd) {
    return NextResponse.json({ error: "Valid start and end dates are required." }, { status: 400 });
  }

  if (parsedEnd < parsedStart) {
    return NextResponse.json({ error: "End date cannot be before start date." }, { status: 400 });
  }

  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "Enabled/disabled status is required." }, { status: 400 });
  }

  if (typeof waiveSurcharge !== "boolean") {
    return NextResponse.json({ error: "Waive surcharge setting is required." }, { status: 400 });
  }

  if (typeof waiveInterest !== "boolean") {
    return NextResponse.json({ error: "Waive interest setting is required." }, { status: 400 });
  }

  try {
    const extension = await createRenewalExtension({
      startDate: parsedStart,
      endDate: parsedEnd,
      isActive,
      waiveSurcharge,
      waiveInterest,
      updatedById: session.user.id,
    });

    return NextResponse.json({ success: true, extension }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      const safeMessage =
        process.env.NODE_ENV !== "production"
          ? error.message
          : "Failed to create renewal extension. Please check your input and try again.";
      return NextResponse.json({ error: safeMessage }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create renewal extension." }, { status: 500 });
  }
}
