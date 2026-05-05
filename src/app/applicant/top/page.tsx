"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { actionButtonStyles } from "@/components/ui/action-button";

const PAYMENT_FREQ_LABELS: Record<string, string> = {
  ANNUAL: "Annual",
  BI_ANNUAL: "Bi-Annual",
  QUARTERLY: "Quarterly",
};

interface TopSummary {
  applicationId: string;
  applicationNumber: string;
  applicationType: string;
  status: string;
  topNumber: string | null;
  assessmentStatus: "DRAFT" | "GENERATED" | null;
  paymentFrequency: "ANNUAL" | "BI_ANNUAL" | "QUARTERLY" | null;
  annualAssessedAmount: number;
  releasePaymentAmount: number;
  amountPaid: number;
  remainingBalance: number;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  mayorsPermitFee: number;
  regulatoryFees: number;
  additionalCharges: number;
  penalties: number;
  surcharge: number;
  interest: number;
  closureCertificateFee: number;
  arrears: number;
  otherCharges: number;
  totalAmount: number;
  remarks: string | null;
  generatedAt: string | null;
  paymentReference: {
    id?: string;
    transactionNumber?: string;
    amountPaid?: number;
    paymentDate?: string;
    submittedAt?: string;
    status?: "PENDING" | "VERIFIED" | "REJECTED";
    reviewerRemarks?: string | null;
    reviewedAt?: string | null;
    proofFileName?: string;
  } | null;
}

function getAmountToPayToRelease(summary: TopSummary): number {
  return summary.releasePaymentAmount;
}

export default function TaxOrderOfPaymentPage() {
  const [summary, setSummary] = useState<TopSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const paymentRef = summary?.paymentReference ?? null;
  const paymentRefStatus = paymentRef?.status ?? null;
  const isPaidStatus = summary?.status === "Paid";
  const canSubmitPaymentReference =
    !!summary && !isPaidStatus && paymentRefStatus !== "PENDING";

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      setLoading(true);
      const response = await fetch("/api/applicant/top", { cache: "no-store" });
      const data = (await response.json()) as { summary?: TopSummary | null };
      if (active) {
        setSummary(data.summary ?? null);
        setLoading(false);
      }
    }

    void loadSummary();
    return () => {
      active = false;
    };
  }, []);

  async function submitReference() {
    if (!summary || !transactionNumber.trim() || !paymentDate || !paymentProof) return;

    const parsedAmount = parseFloat(amountPaid) || 0;

    const payload = new FormData();
    payload.append("applicationId", summary.applicationId);
    payload.append("transactionNumber", transactionNumber.trim());
    payload.append("amountPaid", String(parsedAmount));
    payload.append("paymentDate", paymentDate);
    payload.append("paymentProof", paymentProof);

    const response = await fetch("/api/applicant/top", {
      method: "POST",
      body: payload,
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Unable to submit the payment reference right now. Please review the details and try again.");
      return;
    }

    setMessage("Payment reference submitted. BPLO will verify your payment.");
    setSummary((current) =>
      current
        ? {
            ...current,
            paymentReference: {
              id: current.paymentReference?.id,
              transactionNumber: transactionNumber.trim(),
              amountPaid: parsedAmount,
              paymentDate,
              submittedAt: new Date().toISOString(),
              status: "PENDING",
              reviewerRemarks: null,
              reviewedAt: null,
              proofFileName: paymentProof.name,
            },
          }
        : current
    );
    setTransactionNumber("");
    setAmountPaid("");
    setPaymentDate("");
    setPaymentProof(null);
  }

  const paymentBanner = !summary
    ? null
    : paymentRefStatus === "REJECTED"
      ? {
          title: "Payment reference rejected",
          description: paymentRef?.reviewerRemarks
            ? `BPLO remarks: ${paymentRef.reviewerRemarks}`
            : "Please submit a corrected payment reference.",
          variant: "danger" as const,
        }
      : paymentRefStatus === "VERIFIED"
        ? {
            title: "Payment verified",
            description: "Your submitted payment reference is now read-only.",
            variant: "success" as const,
          }
        : paymentRefStatus === "PENDING"
          ? {
              title: "Payment verification pending",
              description: "Your submitted payment reference is waiting for BPLO review.",
              variant: "warning" as const,
            }
          : {
              title: "Ready for payment reference",
              description: "After payment at MTO or eGov, submit the OR Number / eGov Transaction Number here.",
              variant: "info" as const,
            };

  if (loading) {
    return (
      <section className="space-y-4">
        <PageHeader
          eyebrow="Applicant"
          title="Tax Order of Payment"
          description="Review assessed fees, including Amount to Pay to Release, then submit your payment reference after payment."
        />
        <SectionCard>
          <p className="text-sm text-slate-500">Loading assessed payment details...</p>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Applicant"
        title="Tax Order of Payment"
        description="Review assessed fees, including Amount to Pay to Release, then submit your payment reference after payment."
      />

      {!summary ? (
        <EmptyState
          title="No records available yet"
          description="This section will populate once BPLO completes assessment and marks an application ready for payment. No action is required right now."
        />
      ) : (
        <div className="space-y-4">
          {paymentBanner ? (
            <InfoBanner
              title={paymentBanner.title}
              description={paymentBanner.description}
              variant={paymentBanner.variant}
            />
          ) : null}

          <SectionCard
            title="TOP Summary"
            description={`${summary.applicationNumber} • ${summary.applicationType}`}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-green-700">TOP Number</p>
                <p className="mt-1 font-mono text-xl font-semibold text-green-900">
                  {summary.topNumber ?? "Pending TOP Number"}
                </p>
                {summary.generatedAt ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Generated: {new Date(summary.generatedAt).toLocaleDateString("en-PH")}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Payment Frequency</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {summary.paymentFrequency
                      ? PAYMENT_FREQ_LABELS[summary.paymentFrequency] ?? summary.paymentFrequency
                      : "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Amount to Pay to Release</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    ₱ {getAmountToPayToRelease(summary).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Application Status</p>
                  <p className="mt-1 font-medium text-slate-900">{summary.status}</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Amount shown is for applicant guidance. Official payment verification remains subject to BPLO review.
            </p>
          </SectionCard>

          <SectionCard title="Pay Now" description="Submit transaction details after payment at MTO or eGov.">
              {paymentRef?.transactionNumber ? (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="text-slate-700">
                    Application Number: <strong className="text-slate-900">{summary.applicationNumber}</strong>
                  </p>
                  <p className="mt-1 text-slate-700">
                    OR Number: <strong className="text-slate-900">{paymentRef.transactionNumber}</strong>
                  </p>
                  <p className="mt-1 text-slate-700">
                    Status:{" "}
                    <strong className="text-slate-900">
                      {paymentRefStatus === "VERIFIED"
                        ? "Pass"
                        : paymentRefStatus === "REJECTED"
                          ? "Fail"
                          : "Pending"}
                    </strong>
                  </p>
                </div>
              ) : null}

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    OR Number / eGov Transaction Number
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
                    value={transactionNumber}
                    onChange={(event) => setTransactionNumber(event.target.value)}
                    placeholder="Enter transaction or receipt number"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Amount Paid (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
                    value={amountPaid}
                    onChange={(event) => setAmountPaid(event.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Payment Proof
                  </label>
                  <input
                    type="file"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
                    onChange={(event) => setPaymentProof(event.target.files?.[0] ?? null)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void submitReference();
                  }}
                  disabled={!transactionNumber.trim() || !paymentDate || !paymentProof || !canSubmitPaymentReference}
                  className={actionButtonStyles("primary", "md", "w-full")}
                >
                  Submit Payment Reference
                </button>
                {!canSubmitPaymentReference ? (
                  <p className="text-xs text-slate-500">
                    {isPaidStatus || paymentRefStatus === "VERIFIED"
                      ? "Application is already paid. Payment submission is locked."
                      : "A payment reference is pending verification. Please wait for BPLO action."}
                  </p>
                ) : null}
              </div>
          </SectionCard>

          {message ? (
            <InfoBanner title="Submission update" description={message} variant="success" />
          ) : null}
        </div>
      )}
    </section>
  );
}
