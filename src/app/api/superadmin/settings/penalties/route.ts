import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import { getOrCreateSystemFeeSetting, updateSystemFeeSetting } from "@/lib/fee-settings";
import { logSettingsAction } from "@/lib/audit-log";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export async function GET() {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const penalties = await getOrCreateSystemFeeSetting();
  return NextResponse.json({ penalties });
}

export async function PUT(req: Request) {
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

  const {
    renewalSurchargePercent,
    monthlyInterestPercent,
    liquorTobaccoAddOnPercent,
    powerDistributionFixedFee,
    privatePortFixedFee,
  } = body as Record<string, unknown>;

  if (!isNonNegativeNumber(renewalSurchargePercent)) {
    return NextResponse.json({ error: "Renewal surcharge percent must be non-negative." }, { status: 400 });
  }

  if (!isNonNegativeNumber(monthlyInterestPercent)) {
    return NextResponse.json({ error: "Monthly interest percent must be non-negative." }, { status: 400 });
  }

  if (!isNonNegativeNumber(liquorTobaccoAddOnPercent)) {
    return NextResponse.json({ error: "Liquor/tobacco add-on percent must be non-negative." }, { status: 400 });
  }

  if (typeof powerDistributionFixedFee !== "undefined" && !isNonNegativeNumber(powerDistributionFixedFee)) {
    return NextResponse.json({ error: "Power Distribution fixed fee must be non-negative." }, { status: 400 });
  }

  if (typeof privatePortFixedFee !== "undefined" && !isNonNegativeNumber(privatePortFixedFee)) {
    return NextResponse.json({ error: "Private Port fixed fee must be non-negative." }, { status: 400 });
  }

  try {
    const penalties = await updateSystemFeeSetting({
      renewalSurchargePercent,
      monthlyInterestPercent,
      liquorTobaccoAddOnPercent,
      ...(typeof powerDistributionFixedFee === "number" ? { powerDistributionFixedFee } : {}),
      ...(typeof privatePortFixedFee === "number" ? { privatePortFixedFee } : {}),
      updatedById: session.user.id,
    });
    // Audit: Penalties/system fees updated
    void logSettingsAction(
      session.user.id,
      session.user.name ?? session.user.email ?? null,
      "SUPER_ADMIN",
      "SYSTEM_FEE",
      "default",
      "UPDATED",
      "System fee settings updated",
      {
        renewalSurchargePercent,
        monthlyInterestPercent,
        liquorTobaccoAddOnPercent,
        ...(typeof powerDistributionFixedFee === "number" ? { powerDistributionFixedFee } : {}),
        ...(typeof privatePortFixedFee === "number" ? { privatePortFixedFee } : {}),
      }
    );

    return NextResponse.json({ success: true, penalties });
  } catch {
    return NextResponse.json({ error: "Failed to update penalty settings." }, { status: 500 });
  }
}
