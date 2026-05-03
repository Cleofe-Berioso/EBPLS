"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentDetail, SavedAssessment } from "@/lib/bplo-assessment";
import { actionButtonStyles } from "@/components/ui/action-button";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";

interface Props {
  detail: AssessmentDetail;
}

const PAYMENT_FREQ_LABELS: Record<string, string> = {
  ANNUAL: "Annual",
  BI_ANNUAL: "Bi-Annual (semi-annual)",
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function FeeInput({
  label,
  name,
  value,
  onChange,
  readOnly,
  hint,
}: {
  label: string;
  name: string;
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <div className="flex-1">
        <span className="font-medium text-slate-800">{label}</span>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
      <div className="w-40">
        {readOnly ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-slate-700">
            ₱ {value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </div>
        ) : (
          <input
            type="number"
            name={name}
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-right text-sm focus:border-green-500 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}

export function AssessmentFeeForm({ detail }: Props) {
  const router = useRouter();
  const existing = detail.assessment;
  const suggested = detail.suggestedFees;

  const [paymentFrequency, setPaymentFrequency] = useState<"ANNUAL" | "BI_ANNUAL" | "QUARTERLY">(
    existing?.paymentFrequency ?? "ANNUAL"
  );
  const [mayorsPermitFee, setMayorsPermitFee] = useState(
    existing?.mayorsPermitFee ?? suggested.mayorsPermitFee
  );
  const [regulatoryFees, setRegulatoryFees] = useState(
    existing?.regulatoryFees ?? suggested.regulatoryFees
  );
  const [additionalCharges, setAdditionalCharges] = useState(existing?.additionalCharges ?? 0);
  const [penalties, setPenalties] = useState(existing?.penalties ?? 0);
  const [surcharge, setSurcharge] = useState(existing?.surcharge ?? suggested.surcharge);
  const [interest, setInterest] = useState(existing?.interest ?? suggested.interest);
  const [closureCertificateFee, setClosureCertificateFee] = useState(
    existing?.closureCertificateFee ?? suggested.closureCertificateFee
  );
  const [arrears, setArrears] = useState(existing?.arrears ?? 0);
  const [otherCharges, setOtherCharges] = useState(existing?.otherCharges ?? 0);
  const [remarks, setRemarks] = useState(existing?.remarks ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [savedAssessment, setSavedAssessment] = useState<SavedAssessment | null>(existing);

  const totalAmount =
    mayorsPermitFee +
    regulatoryFees +
    additionalCharges +
    penalties +
    surcharge +
    interest +
    closureCertificateFee +
    arrears +
    otherCharges;

  const isTopGenerated = savedAssessment?.status === "GENERATED";
  const overridesSuggested =
    mayorsPermitFee !== suggested.mayorsPermitFee ||
    regulatoryFees !== suggested.regulatoryFees ||
    surcharge !== suggested.surcharge ||
    interest !== suggested.interest ||
    closureCertificateFee !== suggested.closureCertificateFee;

  function buildPayload() {
    return {
      paymentFrequency,
      mayorsPermitFee,
      regulatoryFees,
      additionalCharges,
      penalties,
      surcharge,
      interest,
      closureCertificateFee,
      arrears,
      otherCharges,
      remarks: remarks.trim() || undefined,
    };
  }

  async function handleSaveDraft() {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/bplo/assessment-fees/${detail.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = (await res.json()) as { saved?: SavedAssessment; error?: string };
      if (!res.ok) {
        setStatusMessage({ kind: "error", text: data.error ?? "Failed to save draft." });
        return;
      }
      setSavedAssessment(data.saved ?? null);
      setStatusMessage({ kind: "success", text: "Assessment draft saved successfully." });
      router.refresh();
    } catch {
      setStatusMessage({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateTop() {
    if (
      !confirm(
        "Generate Tax Order of Payment?\n\nThis will lock the assessment fields, create the TOP number, and move the application to Approved for Payment."
      )
    ) {
      return;
    }
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/bplo/assessment-fees/${detail.id}/generate-top`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = (await res.json()) as { generated?: SavedAssessment; error?: string };
      if (!res.ok) {
        setStatusMessage({ kind: "error", text: data.error ?? "Failed to generate TOP." });
        return;
      }
      setSavedAssessment(data.generated ?? null);
      setStatusMessage({
        kind: "success",
        text: `Tax Order of Payment generated. TOP No.: ${data.generated?.assessmentNumber ?? ""}. Application is now Approved for Payment.`,
      });
      router.refresh();
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
        description="Review the system-suggested computation, adjust BPLO-editable fee fields when needed, then generate the TOP using the existing route behavior."
        variant="info"
      />

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

      <SectionCard title="Business Classification" description="Assessment basis pulled from the current application form data.">
        <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
          <div>
            <span className="text-slate-500">Line of Business</span>
            <p className="font-medium text-slate-900">{detail.lineOfBusiness}</p>
          </div>
          <div>
            <span className="text-slate-500">Business Activity</span>
            <p className="font-medium text-slate-900">{detail.businessActivity}</p>
          </div>
          <div>
            <span className="text-slate-500">Business Type</span>
            <p className="font-medium text-slate-900">{detail.businessType}</p>
          </div>
          <div>
            <span className="text-slate-500">Asset Size</span>
            <p className="font-medium text-slate-900">{detail.assetSize}</p>
          </div>
          <div>
            <span className="text-slate-500">Total Employees</span>
            <p className="font-medium text-slate-900">{detail.totalEmployees}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="System-Computed Suggestion" description="System-generated fee suggestion based on the current application classification.">
        <div className="space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-700">Detected Category</p>
              <p className="mt-1 font-semibold text-blue-900">{suggested.detectedCategory}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-700">Special Rule</p>
              <p className="mt-1 font-semibold text-blue-900">{suggested.specialRuleApplied ?? "None"}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-700">Asset Classification</p>
              <p className="mt-1 font-semibold text-blue-900">{suggested.assetClassification}</p>
              <p className="text-xs text-blue-700">Fee: ₱{suggested.assetBasedFee.toLocaleString("en-PH")}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs uppercase tracking-wide text-blue-700">Worker Classification</p>
              <p className="mt-1 font-semibold text-blue-900">{suggested.workerClassification}</p>
              <p className="text-xs text-blue-700">Fee: ₱{suggested.workerBasedFee.toLocaleString("en-PH")}</p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-900">
              <strong>Selected Classification:</strong> {suggested.selectedClassification}
            </p>
            <p className="mt-1 text-sm text-blue-900">
              <strong>Suggested Mayor&apos;s Permit Fee:</strong> ₱{suggested.selectedMayorPermitFee.toLocaleString("en-PH")}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {suggested.computation}
          </div>

          <p className="text-xs text-slate-500">
            This is the system-suggested fee. You may override it below, but any adjustment should be recorded in remarks.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="BPLO Editable Fees" description="Review the computed suggestion, then adjust only the editable fields needed for final TOP generation.">
        {isTopGenerated ? (
          <div className="mb-4">
            <InfoBanner
              title="TOP already generated"
              description="Fee fields are locked because the Tax Order of Payment has already been generated."
              variant="success"
            />
          </div>
        ) : null}

        {!isTopGenerated ? (
          <div className="mb-4">
            <InfoBanner
              title="Editable assessment area"
              description="These values are the BPLO working copy. Save draft to continue later or generate the TOP once the assessment is final."
              variant="info"
            />
          </div>
        ) : null}

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <SummaryTile
            label="Suggested Total"
            value={`₱ ${(
              suggested.mayorsPermitFee +
              suggested.regulatoryFees +
              suggested.surcharge +
              suggested.interest +
              suggested.closureCertificateFee
            ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            helper="Computed baseline from the current classification"
          />
          <SummaryTile
            label="Working Total"
            value={`₱ ${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
            helper="Current editable total used for draft and TOP generation"
          />
          <SummaryTile
            label="Override Status"
            value={overridesSuggested ? "Adjusted" : "Using suggested fees"}
            helper={
              overridesSuggested
                ? "Record the reason for any adjustment in remarks."
                : "No suggested fee adjustments detected."
            }
          />
        </div>

        <div className="divide-y divide-slate-100">
          <FeeInput
            label="Mayor's Permit Fee"
            name="mayorsPermitFee"
            value={mayorsPermitFee}
            onChange={isTopGenerated ? undefined : setMayorsPermitFee}
            readOnly={isTopGenerated}
            hint={`Suggested: ₱${suggested.mayorsPermitFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          />
          <FeeInput
            label="Regulatory Fees"
            name="regulatoryFees"
            value={regulatoryFees}
            onChange={isTopGenerated ? undefined : setRegulatoryFees}
            readOnly={isTopGenerated}
            hint={`Suggested: ₱${suggested.regulatoryFees.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          />
          <FeeInput
            label="Additional Charges"
            name="additionalCharges"
            value={additionalCharges}
            onChange={isTopGenerated ? undefined : setAdditionalCharges}
            readOnly={isTopGenerated}
          />
          <FeeInput
            label="Penalties"
            name="penalties"
            value={penalties}
            onChange={isTopGenerated ? undefined : setPenalties}
            readOnly={isTopGenerated}
          />
          {detail.applicationType === "RENEWAL" ? (
            <>
              <FeeInput
                label="Surcharge (25% — late renewal)"
                name="surcharge"
                value={surcharge}
                onChange={isTopGenerated ? undefined : setSurcharge}
                readOnly={isTopGenerated}
                hint="Set to 0 if renewal is not late"
              />
              <FeeInput
                label="Interest (2% per month — late renewal)"
                name="interest"
                value={interest}
                onChange={isTopGenerated ? undefined : setInterest}
                readOnly={isTopGenerated}
                hint="Set to 0 if not applicable"
              />
            </>
          ) : null}
          {detail.applicationType === "CLOSURE" ? (
            <>
              <FeeInput
                label="Closure Certificate Fee"
                name="closureCertificateFee"
                value={closureCertificateFee}
                onChange={isTopGenerated ? undefined : setClosureCertificateFee}
                readOnly={isTopGenerated}
                hint="Minimum ₱100.00 for closure applications"
              />
              <FeeInput
                label="Arrears"
                name="arrears"
                value={arrears}
                onChange={isTopGenerated ? undefined : setArrears}
                readOnly={isTopGenerated}
              />
            </>
          ) : null}
          <FeeInput
            label="Other Charges"
            name="otherCharges"
            value={otherCharges}
            onChange={isTopGenerated ? undefined : setOtherCharges}
            readOnly={isTopGenerated}
          />
        </div>

        <div className="mt-4 flex justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
          <span>Total Amount Due</span>
          <span>₱ {totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
        </div>
      </SectionCard>

      <SectionCard title="TOP Details" description="Configure payment schedule and remarks before generating the TOP.">
        {savedAssessment ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Assessment / TOP Number</p>
            <p className="font-mono font-semibold text-slate-900">{savedAssessment.assessmentNumber}</p>
            {savedAssessment.generatedAt ? (
              <p className="mt-1 text-xs text-slate-500">
                Generated: {new Date(savedAssessment.generatedAt).toLocaleString("en-PH")}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4">
          <FormField
            label="Payment Frequency"
            hint="This setting follows existing TOP behavior and does not alter fee computation logic."
            required
          >
            <select
              value={paymentFrequency}
              onChange={(e) => setPaymentFrequency(e.target.value as "ANNUAL" | "BI_ANNUAL" | "QUARTERLY")}
              disabled={isTopGenerated}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-800"
            >
              {Object.entries(PAYMENT_FREQ_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Remarks"
            hint="Required when overriding suggested fees; used for BPLO audit trail only."
          >
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              disabled={isTopGenerated}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-800"
              placeholder="Reason for fee adjustments, assessment notes, etc."
            />
          </FormField>
        </div>
      </SectionCard>

      {statusMessage ? (
        <InfoBanner
          title={statusMessage.kind === "success" ? "Assessment update" : "Assessment error"}
          description={statusMessage.text}
          variant={statusMessage.kind === "success" ? "success" : "danger"}
        />
      ) : null}

      <SectionCard title="TOP Generation Action" description="Save draft for ongoing review, or generate the TOP when this assessment is final.">
        {!isTopGenerated ? (
          <div className="space-y-4">
            <InfoBanner
              title="Generating the TOP will lock this assessment"
              description="Once generated, the TOP number is created, fee fields become read-only, and the application moves to Approved for Payment."
              variant="warning"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => { void handleSaveDraft(); }}
                disabled={isSaving || isGenerating}
                className={actionButtonStyles("secondary", "md")}
              >
                {isSaving ? "Saving..." : "Save Assessment Draft"}
              </button>
              <button
                type="button"
                onClick={() => { void handleGenerateTop(); }}
                disabled={isSaving || isGenerating}
                className={actionButtonStyles("primary", "md")}
              >
                {isGenerating ? "Generating..." : "Generate Tax Order of Payment"}
              </button>
              <Link href="/bplo/assessment-fees" className={actionButtonStyles("ghost", "md")}>
                Back to Queue
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-medium text-green-700">
              TOP generated and locked for this assessment.
            </div>
            <Link href="/bplo/assessment-fees" className={actionButtonStyles("ghost", "md")}>
              Back to Queue
            </Link>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
