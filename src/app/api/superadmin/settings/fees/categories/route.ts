import { NextResponse } from "next/server";
import { logSettingsAction } from "@/lib/audit-log";
import {
  createFeeConfigurationCategory,
  DEFAULT_CLASSIFICATIONS,
  deleteFeeConfigurationCategory,
  getAllFeeCategoryOptions,
  slugifyFeeCategoryKey,
} from "@/lib/fee-settings";
import { requireSuperAdminSession } from "@/lib/superadmin-api";

export async function GET() {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await getAllFeeCategoryOptions();
  return NextResponse.json({ categories });
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

  const { label, key, useDefaultClassifications, useFixedFeeOnly } = body as Record<
    string,
    unknown
  >;

  if (typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "Category label is required." }, { status: 400 });
  }

  // Size customization is not allowed — only default Micro–Large tiers or Fixed Fee.
  const resolvedClassifications =
    useFixedFeeOnly === true
      ? ["Fixed Fee"]
      : useDefaultClassifications === false
        ? []
        : [...DEFAULT_CLASSIFICATIONS];

  if (resolvedClassifications.length === 0) {
    return NextResponse.json(
      { error: "Select default size tiers or fixed fee only." },
      { status: 400 }
    );
  }

  try {
    const category = await createFeeConfigurationCategory({
      label,
      key: typeof key === "string" && key.trim() ? slugifyFeeCategoryKey(key) : undefined,
      classifications: resolvedClassifications,
      updatedById: session.user.id,
    });

    void logSettingsAction(
      session.user.id,
      session.user.name ?? session.user.email ?? null,
      "SUPER_ADMIN",
      "FEE_CATEGORY",
      category.key,
      "CREATED",
      `Fee category added: ${category.label}`,
      { key: category.key, label: category.label, classifications: category.classifications }
    );

    const categories = await getAllFeeCategoryOptions();
    return NextResponse.json({ success: true, category, categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add fee category.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
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

  const { key } = body as Record<string, unknown>;
  if (typeof key !== "string" || !key.trim()) {
    return NextResponse.json({ error: "Category key is required." }, { status: 400 });
  }

  try {
    const deleted = await deleteFeeConfigurationCategory(key);
    void logSettingsAction(
      session.user.id,
      session.user.name ?? session.user.email ?? null,
      "SUPER_ADMIN",
      "FEE_CATEGORY",
      deleted.key,
      "DELETED",
      `Fee category deleted: ${deleted.label} (${deleted.deletedFeeItems} fee entries removed)`,
      deleted
    );

    const categories = await getAllFeeCategoryOptions();
    return NextResponse.json({ success: true, deleted, categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete fee category.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
