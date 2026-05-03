import { NextResponse } from "next/server";
import { requireSuperAdminSession } from "@/lib/superadmin-api";
import {
  type FeeCategoryKey,
  FEE_CATEGORY_OPTIONS,
  listFeeConfigurationItems,
  upsertFeeConfigurationItem,
  updateFeeConfigurationItemById,
} from "@/lib/fee-settings";

function isValidCategory(category: string): boolean {
  return FEE_CATEGORY_OPTIONS.some((item) => item.key === category);
}

export async function GET() {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await listFeeConfigurationItems();
  return NextResponse.json({ items, categories: FEE_CATEGORY_OPTIONS });
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

  const { category, classification, amount, isActive } = body as Record<string, unknown>;

  if (typeof category !== "string" || !isValidCategory(category)) {
    return NextResponse.json({ error: "Invalid business category." }, { status: 400 });
  }

  const feeCategory = category as FeeCategoryKey;

  if (typeof classification !== "string" || !classification.trim()) {
    return NextResponse.json({ error: "Size classification is required." }, { status: 400 });
  }

  if (typeof amount !== "number" || Number.isNaN(amount) || amount < 0) {
    return NextResponse.json({ error: "Fee amount must be a non-negative number." }, { status: 400 });
  }

  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "Active status is required." }, { status: 400 });
  }

  try {
    const item = await upsertFeeConfigurationItem({
      category: feeCategory,
      classification,
      amount,
      isActive,
      updatedById: session.user.id,
    });

    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json({ error: "Failed to save fee configuration." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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

  const { id, amount, isActive } = body as Record<string, unknown>;

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Configuration item ID is required." }, { status: 400 });
  }

  if (typeof amount !== "undefined") {
    if (typeof amount !== "number" || Number.isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: "Fee amount must be a non-negative number." }, { status: 400 });
    }
  }

  if (typeof isActive !== "undefined" && typeof isActive !== "boolean") {
    return NextResponse.json({ error: "Active status must be true or false." }, { status: 400 });
  }

  try {
    const item = await updateFeeConfigurationItemById({
      id,
      ...(typeof amount === "number" ? { amount } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      updatedById: session.user.id,
    });

    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json({ error: "Failed to update fee configuration item." }, { status: 500 });
  }
}
