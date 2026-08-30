import { NextResponse } from "next/server";
import { logSettingsAction } from "@/lib/audit-log";
import {
  createFeeConfigurationCategory,
  DEFAULT_CLASSIFICATIONS,
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

  const { label, key, classifications, useDefaultClassifications, useFixedFeeOnly } = body as Record<
    string,
    unknown
  >;

  if (typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "Category label is required." }, { status: 400 });
  }

  let resolvedClassifications: string[] = [];
  if (useFixedFeeOnly === true) {
    resolvedClassifications = ["Fixed Fee"];
  } else if (Array.isArray(classifications)) {
    resolvedClassifications = classifications.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );
  } else if (typeof classifications === "string") {
    resolvedClassifications = classifications
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (resolvedClassifications.length === 0 && useDefaultClassifications !== false) {
    resolvedClassifications = [...DEFAULT_CLASSIFICATIONS];
  }

  if (resolvedClassifications.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one size classification or enable default classifications." },
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
