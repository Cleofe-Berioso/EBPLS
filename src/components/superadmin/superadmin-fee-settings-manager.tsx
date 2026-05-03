"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { InfoBanner } from "@/components/ui/info-banner";
import { RoleBadge } from "@/components/ui/role-badge";
import { StatCard } from "@/components/ui/stat-card";
import { SectionCard } from "@/components/ui/section-card";
import { FormField } from "@/components/ui/form-field";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { actionButtonStyles } from "@/components/ui/action-button";

type Flash = { type: "success" | "danger" | "info"; message: string } | null;

type FeeCategoryOption = {
  key: string;
  label: string;
};

type FeeItem = {
  id: string;
  category: string;
  classification: string;
  amount: number;
  isActive: boolean;
  updatedAt: string;
};

type Penalties = {
  id: string;
  renewalSurchargePercent: number;
  monthlyInterestPercent: number;
  liquorTobaccoAddOnPercent: number;
  powerDistributionFixedFee: number;
  privatePortFixedFee: number;
  updatedAt: string;
};

type RenewalExtension = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  waiveSurcharge: boolean;
  waiveInterest: boolean;
  remarks: string | null;
  updatedAt: string;
};

type FeeResponse = { items?: FeeItem[]; categories?: FeeCategoryOption[]; error?: string };
type PenaltyResponse = { penalties?: Penalties; error?: string };
type ExtensionResponse = { extensions?: RenewalExtension[]; error?: string };

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-PH");
}

function formatAmount(value: number): string {
  return `PHP ${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function extensionStatus(extension: RenewalExtension) {
  return extension.isActive ? (
    <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-900">
      Enabled
    </span>
  ) : (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
      Disabled
    </span>
  );
}

const EMPTY_PENALTIES: Penalties = {
  id: "",
  renewalSurchargePercent: 25,
  monthlyInterestPercent: 2,
  liquorTobaccoAddOnPercent: 25,
  powerDistributionFixedFee: 10000,
  privatePortFixedFee: 50000,
  updatedAt: "",
};

export function SuperAdminFeeSettingsManager() {
  const [flash, setFlash] = useState<Flash>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [categories, setCategories] = useState<FeeCategoryOption[]>([]);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [penalties, setPenalties] = useState<Penalties>(EMPTY_PENALTIES);
  const [extensions, setExtensions] = useState<RenewalExtension[]>([]);

  const [feeForm, setFeeForm] = useState({
    category: "",
    classification: "",
    amount: "",
    isActive: true,
  });

  const [penaltyForm, setPenaltyForm] = useState({
    renewalSurchargePercent: "25",
    monthlyInterestPercent: "2",
    liquorTobaccoAddOnPercent: "25",
    powerDistributionFixedFee: "10000",
    privatePortFixedFee: "50000",
  });

  const [extensionForm, setExtensionForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
    isActive: true,
    waiveSurcharge: true,
    waiveInterest: false,
    remarks: "",
  });

  async function loadSettings() {
    setIsLoading(true);
    setFlash(null);

    try {
      const [feeRes, penaltiesRes, extRes] = await Promise.all([
        fetch("/api/superadmin/settings/fees", { cache: "no-store" }),
        fetch("/api/superadmin/settings/penalties", { cache: "no-store" }),
        fetch("/api/superadmin/settings/extensions", { cache: "no-store" }),
      ]);

      const feeJson = (await feeRes.json()) as FeeResponse;
      const penaltiesJson = (await penaltiesRes.json()) as PenaltyResponse;
      const extJson = (await extRes.json()) as ExtensionResponse;

      if (!feeRes.ok || !penaltiesRes.ok || !extRes.ok) {
        setFlash({
          type: "danger",
          message:
            feeJson.error ?? penaltiesJson.error ?? extJson.error ?? "Failed to load system settings.",
        });
        return;
      }

      const nextCategories = feeJson.categories ?? [];
      const nextPenalties = penaltiesJson.penalties ?? EMPTY_PENALTIES;

      setCategories(nextCategories);
      setFeeItems(feeJson.items ?? []);
      setPenalties(nextPenalties);
      setExtensions(extJson.extensions ?? []);
      setFeeForm((prev) => ({
        ...prev,
        category: prev.category || nextCategories[0]?.key || "",
      }));
      setPenaltyForm({
        renewalSurchargePercent: String(nextPenalties.renewalSurchargePercent),
        monthlyInterestPercent: String(nextPenalties.monthlyInterestPercent),
        liquorTobaccoAddOnPercent: String(nextPenalties.liquorTobaccoAddOnPercent),
        powerDistributionFixedFee: String(nextPenalties.powerDistributionFixedFee),
        privatePortFixedFee: String(nextPenalties.privatePortFixedFee),
      });
    } catch {
      setFlash({ type: "danger", message: "Failed to load system settings." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  const summary = useMemo(() => {
    const activeCategories = new Set(feeItems.filter((item) => item.isActive).map((item) => item.category)).size;
    const activeExtension = extensions.find((item) => item.isActive) ?? null;

    return {
      activeCategories,
      renewalSurcharge: penalties.renewalSurchargePercent,
      monthlyInterest: penalties.monthlyInterestPercent,
      activeExtension: activeExtension ? activeExtension.title : "None",
    };
  }, [extensions, feeItems, penalties.monthlyInterestPercent, penalties.renewalSurchargePercent]);

  const recentUpdates = useMemo(() => {
    const rows = [
      ...feeItems.map((item) => ({
        type: "Fee Table",
        message: `${item.category} / ${item.classification}: ${formatAmount(item.amount)}`,
        updatedAt: item.updatedAt,
      })),
      {
        type: "Penalties",
        message: `Surcharge ${penalties.renewalSurchargePercent}% | Interest ${penalties.monthlyInterestPercent}% | Liquor/Tobacco ${penalties.liquorTobaccoAddOnPercent}%`,
        updatedAt: penalties.updatedAt || new Date(0).toISOString(),
      },
      ...extensions.map((item) => ({
        type: "Extension",
        message: `${item.title} (${item.isActive ? "Enabled" : "Disabled"})`,
        updatedAt: item.updatedAt,
      })),
    ];

    return rows.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8);
  }, [extensions, feeItems, penalties]);

  async function saveFeeItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFlash(null);

    const amount = Number(feeForm.amount);
    if (Number.isNaN(amount) || amount < 0) {
      setFlash({ type: "danger", message: "Fee amount must be a non-negative number." });
      return;
    }

    try {
      const res = await fetch("/api/superadmin/settings/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: feeForm.category,
          classification: feeForm.classification,
          amount,
          isActive: feeForm.isActive,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFlash({ type: "danger", message: json.error ?? "Failed to save fee table entry." });
        return;
      }

      setFlash({ type: "success", message: "Fee table entry saved." });
      setFeeForm((prev) => ({ ...prev, classification: "", amount: "" }));
      await loadSettings();
    } catch {
      setFlash({ type: "danger", message: "Failed to save fee table entry." });
    }
  }

  async function toggleFeeItem(item: FeeItem) {
    setFlash(null);
    try {
      const res = await fetch("/api/superadmin/settings/fees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFlash({ type: "danger", message: json.error ?? "Failed to update fee item status." });
        return;
      }

      setFlash({ type: "success", message: `Updated fee item status: ${item.classification}.` });
      await loadSettings();
    } catch {
      setFlash({ type: "danger", message: "Failed to update fee item status." });
    }
  }

  async function savePenalties(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFlash(null);

    const renewalSurchargePercent = Number(penaltyForm.renewalSurchargePercent);
    const monthlyInterestPercent = Number(penaltyForm.monthlyInterestPercent);
    const liquorTobaccoAddOnPercent = Number(penaltyForm.liquorTobaccoAddOnPercent);
    const powerDistributionFixedFee = Number(penaltyForm.powerDistributionFixedFee);
    const privatePortFixedFee = Number(penaltyForm.privatePortFixedFee);

    const all = [
      renewalSurchargePercent,
      monthlyInterestPercent,
      liquorTobaccoAddOnPercent,
      powerDistributionFixedFee,
      privatePortFixedFee,
    ];

    if (all.some((value) => Number.isNaN(value) || value < 0)) {
      setFlash({ type: "danger", message: "Penalty and fixed-fee values must be non-negative." });
      return;
    }

    try {
      const res = await fetch("/api/superadmin/settings/penalties", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renewalSurchargePercent,
          monthlyInterestPercent,
          liquorTobaccoAddOnPercent,
          powerDistributionFixedFee,
          privatePortFixedFee,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFlash({ type: "danger", message: json.error ?? "Failed to save surcharge/interest settings." });
        return;
      }

      setFlash({ type: "success", message: "Surcharge and interest settings updated." });
      await loadSettings();
    } catch {
      setFlash({ type: "danger", message: "Failed to save surcharge/interest settings." });
    }
  }

  async function createExtension(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFlash(null);

    if (!extensionForm.title.trim()) {
      setFlash({ type: "danger", message: "Extension title is required." });
      return;
    }

    if (!extensionForm.startDate || !extensionForm.endDate) {
      setFlash({ type: "danger", message: "Start and end date are required." });
      return;
    }

    if (new Date(extensionForm.endDate) < new Date(extensionForm.startDate)) {
      setFlash({ type: "danger", message: "End date cannot be before start date." });
      return;
    }

    try {
      const res = await fetch("/api/superadmin/settings/extensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extensionForm),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFlash({ type: "danger", message: json.error ?? "Failed to create renewal extension." });
        return;
      }

      setFlash({ type: "success", message: "Renewal extension saved." });
      setExtensionForm((prev) => ({
        ...prev,
        title: "",
        startDate: "",
        endDate: "",
        remarks: "",
        isActive: true,
        waiveSurcharge: true,
        waiveInterest: false,
      }));
      await loadSettings();
    } catch {
      setFlash({ type: "danger", message: "Failed to create renewal extension." });
    }
  }

  async function toggleExtension(item: RenewalExtension) {
    setFlash(null);
    try {
      const res = await fetch(`/api/superadmin/settings/extensions/${item.id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFlash({ type: "danger", message: json.error ?? "Failed to toggle extension." });
        return;
      }
      setFlash({ type: "success", message: `Extension ${item.isActive ? "disabled" : "enabled"}.` });
      await loadSettings();
    } catch {
      setFlash({ type: "danger", message: "Failed to toggle extension." });
    }
  }

  const flashVariant = flash?.type === "danger" ? "danger" : flash?.type === "success" ? "success" : "info";

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        eyebrowClassName="text-slate-600"
        title="System Fee Settings"
        description="Configure fee tables, renewal penalties, and official extension rules."
        badge={<RoleBadge role="VIEW_ONLY" label="Configuration Scope" />}
      />

      <InfoBanner
        title="Super Admin scope"
        description="This module updates global fee configuration only. Workflow actions for applications, payments, permits, and business location remain unavailable to Super Admin."
        variant="readOnly"
      />

      {flash ? <InfoBanner title={flash.message} variant={flashVariant} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Fee Categories" value={summary.activeCategories.toString()} subtitle="Categories with active configured entries" tone="blue" />
        <StatCard title="Renewal Surcharge" value={`${summary.renewalSurcharge.toLocaleString("en-PH")} %`} subtitle="Applied to late renewals" tone="amber" />
        <StatCard title="Monthly Interest" value={`${summary.monthlyInterest.toLocaleString("en-PH")} %`} subtitle="Applied per late month" tone="slate" />
        <StatCard title="Active Extension" value={summary.activeExtension} subtitle="Current enabled renewal extension" tone="green" />
      </div>

      <SectionCard
        title="Fee Table Maintenance"
        description="Configure Mayor's Permit Fee entries by business category and size classification."
      >
        <form className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-5" onSubmit={saveFeeItem}>
          <FormField label="Business Category" required>
            <select
              value={feeForm.category}
              onChange={(e) => setFeeForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            >
              {categories.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Size Classification" required hint="Example: Micro Industry, Small-Scale Industries A">
            <input
              value={feeForm.classification}
              onChange={(e) => setFeeForm((prev) => ({ ...prev, classification: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <FormField label="Fee Amount" required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={feeForm.amount}
              onChange={(e) => setFeeForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <FormField label="Status" required>
            <select
              value={feeForm.isActive ? "ACTIVE" : "INACTIVE"}
              onChange={(e) => setFeeForm((prev) => ({ ...prev, isActive: e.target.value === "ACTIVE" }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </FormField>

          <div className="flex items-end">
            <button type="submit" className={actionButtonStyles("primary", "sm", "w-full")} disabled={isLoading}>
              Save Fee Entry
            </button>
          </div>
        </form>

        <div className="mt-4">
          <ResponsiveDataTable
            title="Configured Fee Table Entries"
            description={isLoading ? "Loading configured entries..." : `${feeItems.length} fee table entries`} 
            table={
              feeItems.length === 0 && !isLoading ? (
                <div className="p-5">
                  <EmptyState title="No fee configuration entries yet" description="Add entries to override hardcoded fee defaults." />
                </div>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Classification</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Updated At</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {feeItems.map((item) => (
                      <tr key={item.id} className="align-top hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.category}</td>
                        <td className="px-4 py-3 text-slate-700">{item.classification}</td>
                        <td className="px-4 py-3 text-slate-700">{formatAmount(item.amount)}</td>
                        <td className="px-4 py-3">
                          {item.isActive ? (
                            <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-900">Active</span>
                          ) : (
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(item.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className={actionButtonStyles(item.isActive ? "warning" : "secondary", "sm")}
                            onClick={() => void toggleFeeItem(item)}
                          >
                            {item.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
            mobile={
              feeItems.length === 0 && !isLoading ? (
                <div className="p-5">
                  <EmptyState title="No fee configuration entries yet" description="Add entries to override hardcoded fee defaults." />
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {feeItems.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{item.category}</p>
                      <p className="text-xs text-slate-600">{item.classification}</p>
                      <p className="mt-1 text-sm text-slate-700">{formatAmount(item.amount)}</p>
                      <p className="mt-1 text-xs text-slate-500">Updated: {formatDate(item.updatedAt)}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div>
                          {item.isActive ? (
                            <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-900">Active</span>
                          ) : (
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">Inactive</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className={actionButtonStyles(item.isActive ? "warning" : "secondary", "sm")}
                          onClick={() => void toggleFeeItem(item)}
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Surcharge and Interest Settings"
        description="Configure renewal surcharge, monthly interest, and liquor/tobacco add-on percentages."
      >
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={savePenalties}>
          <FormField label="Renewal Late Surcharge (%)" required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={penaltyForm.renewalSurchargePercent}
              onChange={(e) => setPenaltyForm((prev) => ({ ...prev, renewalSurchargePercent: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <FormField label="Monthly Interest (%)" required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={penaltyForm.monthlyInterestPercent}
              onChange={(e) => setPenaltyForm((prev) => ({ ...prev, monthlyInterestPercent: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <FormField label="Liquor/Tobacco Add-on (%)" required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={penaltyForm.liquorTobaccoAddOnPercent}
              onChange={(e) => setPenaltyForm((prev) => ({ ...prev, liquorTobaccoAddOnPercent: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <FormField label="Power Generation/Distribution Fixed Fee" required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={penaltyForm.powerDistributionFixedFee}
              onChange={(e) => setPenaltyForm((prev) => ({ ...prev, powerDistributionFixedFee: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <FormField label="Private Port Fixed Fee" required>
            <input
              type="number"
              min={0}
              step="0.01"
              value={penaltyForm.privatePortFixedFee}
              onChange={(e) => setPenaltyForm((prev) => ({ ...prev, privatePortFixedFee: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <div className="md:col-span-2 xl:col-span-5 flex justify-end">
            <button type="submit" className={actionButtonStyles("primary", "sm")} disabled={isLoading}>
              Save Penalty Settings
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Renewal Extension Settings"
        description="Create, enable, and disable extension periods with surcharge/interest waiver rules."
      >
        <form className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={createExtension}>
          <FormField label="Extension Title" required>
            <input
              value={extensionForm.title}
              onChange={(e) => setExtensionForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <FormField label="Start Date" required>
            <input
              type="date"
              value={extensionForm.startDate}
              onChange={(e) => setExtensionForm((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <FormField label="End Date" required>
            <input
              type="date"
              value={extensionForm.endDate}
              onChange={(e) => setExtensionForm((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <FormField label="Waive Surcharge During Extension" required>
            <select
              value={extensionForm.waiveSurcharge ? "YES" : "NO"}
              onChange={(e) => setExtensionForm((prev) => ({ ...prev, waiveSurcharge: e.target.value === "YES" }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            >
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </FormField>

          <FormField label="Waive Interest During Extension" required>
            <select
              value={extensionForm.waiveInterest ? "YES" : "NO"}
              onChange={(e) => setExtensionForm((prev) => ({ ...prev, waiveInterest: e.target.value === "YES" }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            >
              <option value="YES">Yes</option>
              <option value="NO">No</option>
            </select>
          </FormField>

          <FormField label="Enabled Status" required>
            <select
              value={extensionForm.isActive ? "ENABLED" : "DISABLED"}
              onChange={(e) => setExtensionForm((prev) => ({ ...prev, isActive: e.target.value === "ENABLED" }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            >
              <option value="ENABLED">Enabled</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </FormField>

          <FormField label="Remarks / Reason">
            <input
              value={extensionForm.remarks}
              onChange={(e) => setExtensionForm((prev) => ({ ...prev, remarks: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
            />
          </FormField>

          <div className="md:col-span-2 xl:col-span-3 flex justify-end">
            <button type="submit" className={actionButtonStyles("primary", "sm")} disabled={isLoading}>
              Save Extension
            </button>
          </div>
        </form>

        <div className="mt-4">
          <ResponsiveDataTable
            title="Configured Renewal Extensions"
            description={extensions.length === 0 ? "No extensions configured yet." : `${extensions.length} extensions configured`} 
            table={
              extensions.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No renewal extensions yet" description="Create extension windows for special renewal periods." />
                </div>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Title</th>
                      <th className="px-4 py-3 font-semibold">Period</th>
                      <th className="px-4 py-3 font-semibold">Waive Surcharge</th>
                      <th className="px-4 py-3 font-semibold">Waive Interest</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Updated</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extensions.map((item) => (
                      <tr key={item.id} className="align-top hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {new Date(item.startDate).toLocaleDateString("en-PH")} - {new Date(item.endDate).toLocaleDateString("en-PH")}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{item.waiveSurcharge ? "Yes" : "No"}</td>
                        <td className="px-4 py-3 text-slate-700">{item.waiveInterest ? "Yes" : "No"}</td>
                        <td className="px-4 py-3">{extensionStatus(item)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(item.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void toggleExtension(item)}
                            className={actionButtonStyles(item.isActive ? "warning" : "secondary", "sm")}
                          >
                            {item.isActive ? "Disable" : "Enable"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
            mobile={
              extensions.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No renewal extensions yet" description="Create extension windows for special renewal periods." />
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {extensions.map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {new Date(item.startDate).toLocaleDateString("en-PH")} - {new Date(item.endDate).toLocaleDateString("en-PH")}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">Waive Surcharge: {item.waiveSurcharge ? "Yes" : "No"}</p>
                      <p className="text-xs text-slate-600">Waive Interest: {item.waiveInterest ? "Yes" : "No"}</p>
                      <p className="mt-1 text-xs text-slate-500">Updated: {formatDate(item.updatedAt)}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {extensionStatus(item)}
                        <button
                          type="button"
                          onClick={() => void toggleExtension(item)}
                          className={actionButtonStyles(item.isActive ? "warning" : "secondary", "sm")}
                        >
                          {item.isActive ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )
            }
          />
        </div>
      </SectionCard>

      <SectionCard title="Recent Configuration Updates" description="Latest changes across fee table, penalties, and extension settings.">
        {recentUpdates.length === 0 ? (
          <EmptyState title="No configuration updates yet" description="Saved settings will appear here." />
        ) : (
          <div className="space-y-2">
            {recentUpdates.map((item, index) => (
              <div key={`${item.type}-${index}-${item.updatedAt}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{item.type}</p>
                <p className="mt-1">{item.message}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(item.updatedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </section>
  );
}
