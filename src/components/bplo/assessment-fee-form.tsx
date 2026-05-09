"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentDetail, AssessmentLineItem, SavedAssessment } from "@/lib/bplo-assessment";
import { actionButtonStyles } from "@/components/ui/action-button";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";

interface Props {
  detail: AssessmentDetail;
}

type PaymentFrequency = "ANNUAL" | "BI_ANNUAL" | "QUARTERLY";

const PAYMENT_FREQ_LABELS: Record<PaymentFrequency, string> = {
  ANNUAL: "Annual",
  BI_ANNUAL: "Bi-Annual",
  QUARTERLY: "Quarterly",
};

function SummaryTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function emptyLineItem(index: number): AssessmentLineItem {
  return {
    id: `draft-${index}`,
    description: "",
    amount: 0,
    sortOrder: index,
    isSystemGenerated: false,
  };
}

function getReleasePaymentAmount(totalAmount: number, frequency: PaymentFrequency) {
  void frequency;
  return totalAmount;
}

function normalizeLineItems(lineItems: AssessmentLineItem[]) {
  return lineItems.map((item, index) => ({ ...item, sortOrder: index }));
}

export function AssessmentFeeForm({ detail }: Props) {
  const router = useRouter();
  const existing = detail.assessment;
  const initialLineItems = existing?.lineItems.length
    ? existing.lineItems
    : detail.suggestedLineItems.length
      ? detail.suggestedLineItems
      : [emptyLineItem(0)];

  const [lineItems, setLineItems] = useState<AssessmentLineItem[]>(normalizeLineItems(initialLineItems));
  const [closurePaymentDues, setClosurePaymentDues] = useState(existing?.closurePaymentDues ?? 0);
  const [remarks, setRemarks] = useState(existing?.remarks ?? "");
  const [savedAssessment, setSavedAssessment] = useState<SavedAssessment | null>(existing);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const editableLineItems = lineItems.filter((item) => !item.isSystemGenerated);
  const systemLineItems = lineItems.filter((item) => item.isSystemGenerated);
  const lineItemSubtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = lineItemSubtotal + closurePaymentDues;
  const paymentFrequency = savedAssessment?.paymentFrequency ?? detail.applicantPaymentFrequency ?? "ANNUAL";
  const releasePaymentAmount = getReleasePaymentAmount(totalAmount, paymentFrequency);
  const amountPaid = savedAssessment?.amountPaid ?? 0;
  const remainingBalance = Math.max(0, totalAmount - amountPaid);
  const isTopGenerated = savedAssessment?.status === "GENERATED";

  function syncSavedAssessment(saved: SavedAssessment | null) {
    setSavedAssessment(saved);
    if (!saved) {
      return;
    }

    setLineItems(normalizeLineItems(saved.lineItems.length ? saved.lineItems : lineItems));
    setClosurePaymentDues(saved.closurePaymentDues);
    setRemarks(saved.remarks ?? "");
  }

  function addLineItem() {
    setLineItems((current) => normalizeLineItems([...current, emptyLineItem(current.length)]));
  }

  function updateLineItem(index: number, next: Partial<AssessmentLineItem>) {
    setLineItems((current) =>
      normalizeLineItems(
        current.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                ...next,
              }
            : item
        )
      )
    );
  }

  function removeLineItem(index: number) {
    setLineItems((current) => normalizeLineItems(current.filter((_, itemIndex) => itemIndex !== index)));
  }

  function buildPayload() {
    return {
      lineItems,
      closurePaymentDues,
      remarks: remarks.trim() || undefined,
    };
  }

  const displayPaymentFrequency = savedAssessment?.paymentFrequency ?? detail.applicantPaymentFrequency;

  async function submit(url: string, key: "saved" | "generated") {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    const data = (await response.json()) as {
      saved?: SavedAssessment;
      generated?: SavedAssessment;
      error?: string;
    };

    if (!response.ok) {
      setStatusMessage({ kind: "error", text: data.error ?? "Unable to save assessment." });
      return;
    }

    const nextAssessment = data[key] ?? null;
    syncSavedAssessment(nextAssessment);
    setStatusMessage({
      kind: "success",
      text:
        key === "generated"
          ? `Tax Order of Payment generated. TOP No.: ${nextAssessment?.assessmentNumber ?? ""}.`
          : "Assessment draft saved successfully.",
    });
    router.refresh();
  }

  async function handleSaveDraft() {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await submit(`/api/bplo/assessment-fees/${detail.id}/draft`, "saved");
    } catch {
      setStatusMessage({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateTop() {
    if (
      !confirm(
        "Generate Tax Order of Payment?\n\nThis will lock the assessment, create the TOP number, and move the application to Approved for Payment."
      )
    ) {
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);
    try {
      await submit(`/api/bplo/assessment-fees/${detail.id}/generate-top`, "generated");
    } catch {
      setStatusMessage({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <InfoBanner
        title="Assessment workspace"
        description="Build the Tax Order of Payment using auditable fee line items. System-generated penalties and closure fees stay locked."
        variant="info"
      />

      {statusMessage ? (
        <InfoBanner
          title={statusMessage.kind === "success" ? "Assessment update" : "Assessment issue"}
          description={statusMessage.text}
          variant={statusMessage.kind === "success" ? "success" : "danger"}
        />
      ) : null}

      <SectionCard title="Application Summary" description="Current assessment target and applicant record.">
        <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <span className="text-slate-500">Application No.</span>
            <p className="font-mono font-medium text-slate-900">{detail.applicationNumber}</p>
          </div>
          <div>
            <span className="text-slate-500">Type</span>
            <p className="font-medium capitalize text-slate-900">{detail.applicationType.toLowerCase()}</p>
          </div>
          <div>
            <span className="text-slate-500">Status</span>
            <p className="font-medium text-slate-900">{detail.status}</p>
          </div>
          <div>
            <span className="text-slate-500">Applicant</span>
            <p className="font-medium text-slate-900">{detail.applicant.name}</p>
            <p className="text-xs text-slate-600">{detail.applicant.email}</p>
          </div>
          <div className="md:col-span-2 xl:col-span-4">
            <span className="text-slate-500">Business Name</span>
            <p className="font-medium text-slate-900">{detail.businessName}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="System Guidance" description="Assessment basis from the current application and automatic penalty rules.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Line of Business" value={detail.lineOfBusiness} />
          <SummaryTile label="Detected Category" value={detail.suggestedFees.detectedCategory} />
          <SummaryTile label="Suggested Mayor's Fee" value={`₱ ${detail.suggestedFees.selectedMayorPermitFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} />
          <SummaryTile
            label="Late Renewal Rule"
            value={
              detail.applicationType === "RENEWAL" && detail.suggestedFees.overdueMonths > 12
                ? `${detail.suggestedFees.overdueMonths} months overdue`
                : "Not triggered"
            }
            helper="Automatic surcharge and interest apply only beyond 1 year overdue."
          />
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/85 p-4 text-sm text-slate-700">
          {detail.suggestedFees.computation}
        </div>
      </SectionCard>

      <SectionCard
        title="Fee Line Items"
        description="Add BPLO fee items, then review the system-generated items below."
        action={
          !isTopGenerated ? (
            <button type="button" onClick={addLineItem} className={actionButtonStyles("secondary", "md")}>
              Add Item
            </button>
          ) : undefined
        }
      >
        {isTopGenerated ? (
          <div className="mb-4">
            <InfoBanner
              title="TOP already generated"
              description="Fee items are locked because the Tax Order of Payment has already been generated."
              variant="success"
            />
          </div>
        ) : null}

        <div className="space-y-3">
          {editableLineItems.map((item) => {
            const actualIndex = lineItems.findIndex((candidate) => candidate.id === item.id);
            return (
              <div key={item.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_auto]">
                <input
                  value={item.description}
                  disabled={isTopGenerated}
                  onChange={(event) => updateLineItem(actualIndex, { description: event.target.value })}
                  placeholder="Fee description"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.amount}
                  disabled={isTopGenerated}
                  onChange={(event) => updateLineItem(actualIndex, { amount: Number(event.target.value) || 0 })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-right text-sm focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isTopGenerated}
                  onClick={() => removeLineItem(actualIndex)}
                  className={actionButtonStyles("ghost", "md")}
                >
                  Remove
                </button>
              </div>
            );
          })}

          {editableLineItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No BPLO-entered fee items yet.
            </div>
          ) : null}

          {systemLineItems.length > 0 ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">System-generated items</p>
              {systemLineItems.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 md:grid-cols-[1fr_180px]">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.description}</p>
                    <p className="text-xs text-slate-600">Automatically computed and not editable.</p>
                  </div>
                  <div className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-right text-sm font-medium text-slate-800">
                    ₱ {item.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </SectionCard>

      {detail.applicationType === "CLOSURE" ? (
        <SectionCard
          title="Closure Charges"
          description="Payment dues are BPLO-entered. The fixed closure certificate fee of ₱100 is added automatically."
        >
          <FormField label="Payment Dues / Pending Fee" hint="Enter any outstanding payment dues or pending fees for the business before closure release.">
            <input
              type="number"
              min="0"
              step="0.01"
              value={closurePaymentDues}
              disabled={isTopGenerated}
              onChange={(event) => setClosurePaymentDues(Number(event.target.value) || 0)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-right text-sm focus:border-emerald-500 focus:outline-none"
            />
          </FormField>
        </SectionCard>
      ) : null}

      <SectionCard title="TOP Summary" description="Assessment totals are recalculated on the server during draft save and TOP generation.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile
            label="Payment Frequency"
            value={displayPaymentFrequency ? PAYMENT_FREQ_LABELS[displayPaymentFrequency] : "Not selected"}
            helper="Applicant-selected frequency (read-only for BPLO)."
          />
          <SummaryTile label="Total Amount" value={`₱ ${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} />
          <SummaryTile label="Total Amount to Pay" value={`₱ ${releasePaymentAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} />
          <SummaryTile label="Remaining Balance" value={`₱ ${remainingBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} />
        </div>

        <div className="mt-4">
          <FormField label="Remarks" hint="Explain manual adjustments or special cases for audit review.">
            <textarea
              rows={4}
              value={remarks}
              disabled={isTopGenerated}
              onChange={(event) => setRemarks(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Actions"
        description="Save the draft to continue later, or generate the Tax Order of Payment to move the application forward."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/bplo/assessment-fees" className={actionButtonStyles("ghost", "md")}>
              Back to Queue
            </Link>
            {!isTopGenerated ? (
              <button
                type="button"
                disabled={isSaving || isGenerating}
                onClick={() => {
                  void handleSaveDraft();
                }}
                className={actionButtonStyles("secondary", "md")}
              >
                Save Draft
              </button>
            ) : null}
            <button
              type="button"
              disabled={isTopGenerated || isSaving || isGenerating}
              onClick={() => {
                void handleGenerateTop();
              }}
              className={actionButtonStyles("primary", "md")}
            >
              Generate TOP
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Applicant payment submission becomes available only after TOP generation. Payment verification and permit issuance continue in their own modules.
        </p>
      </SectionCard>
    </div>
  );
}
