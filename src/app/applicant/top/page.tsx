"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { actionButtonStyles } from "@/components/ui/action-button";
import {
  applicantFormControlClass,
  applicantHighlightPanelClass,
  applicantListCardClass,
  applicantPanelClass,
  applicantSummaryLabelClass,
  applicantSummaryTileClass,
  applicantSummaryValueClass,
  applicantWarningPanelClass,
} from "@/components/applicant/applicant-ui-styles";

const PAYMENT_FREQ_LABELS: Record<string, string> = {
  ANNUAL: "Annual",
  BI_ANNUAL: "Bi-Annual",
  QUARTERLY: "Quarterly",
};

interface TopSummary {
  applicationId: string;
  applicationNumber: string;
  businessName: string;
  applicationType: string;
  status: string;
  topNumber: string | null;
  assessmentStatus: "DRAFT" | "GENERATED" | null;
  reassessmentRequestedAt?: string | null;
  rawStatus?: string;
  paymentFrequency: "ANNUAL" | "BI_ANNUAL" | "QUARTERLY" | null;
  mayorsPermitFee: number;
  regulatoryFees: number;
  additionalCharges: number;
  penalties: number;
  surcharge: number;
  interest: number;
  closurePaymentDues: number;
  closureCertificateFee: number;
  arrears: number;
  otherCharges: number;
  totalAmount: number;
  remarks: string | null;
  generatedAt: string | null;
  lineItems: Array<{
    id: string;
    description: string;
    amount: number;
    isSystemGenerated: boolean;
  }>;
  paymentReference: {
    id?: string;
    transactionNumber?: string;
    officialReceiptNumber?: string;
    amountPaid?: number;
    paymentDate?: string;
    submittedAt?: string;
    status?: "PENDING" | "VERIFIED" | "REJECTED";
    reviewerRemarks?: string | null;
    reviewedAt?: string | null;
    proofFileName?: string;
  } | null;
}

interface TopPageData {
  activeSummary: TopSummary | null;
  records: TopSummary[];
}

export default function TaxOrderOfPaymentPage() {
  const [topData, setTopData] = useState<TopPageData>({ activeSummary: null, records: [] });
  const [loading, setLoading] = useState(true);
  const [transactionNumber, setTransactionNumber] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const summary = topData.activeSummary;
  const paymentRef = summary?.paymentReference ?? null;
  const paymentRefStatus = paymentRef?.status ?? null;
  const isReassessmentPending = Boolean(summary?.reassessmentRequestedAt);
  const isPaidStatus = summary?.status === "Paid";
  const isPaymentVerified = paymentRefStatus === "VERIFIED";
  const isPaymentPending = paymentRefStatus === "PENDING";
  // Allow re-submission only when paymentRef is null or REJECTED.
  // Block if: already paid, VERIFIED (already accepted), PENDING (awaiting review), or reassessment active.
  const canSubmitPaymentReference =
    !!summary &&
    !isPaidStatus &&
    !isPaymentVerified &&
    !isPaymentPending &&
    !isReassessmentPending &&
    summary.rawStatus === "APPROVED_FOR_PAYMENT";
  const canRequestReassessment =
    !!summary &&
    summary.assessmentStatus === "GENERATED" &&
    !summary.reassessmentRequestedAt &&
    !summary.paymentReference &&
    !["FOR_RELEASE", "RELEASED", "PAID"].includes(summary.rawStatus ?? "");

  // DEBUG — remove after confirming correct values in browser console
  if (typeof window !== "undefined" && summary) {
    console.log("[TOP DEBUG]", {
      applicationId: summary.applicationId,
      applicationNumber: summary.applicationNumber,
      applicationType: summary.applicationType,
      rawStatus: summary.rawStatus,
      status: summary.status,
      assessmentStatus: summary.assessmentStatus,
      totalAmount: summary.totalAmount,
      paymentReference: summary.paymentReference,
      paymentRefStatus,
      isPaymentPending,
      isPaymentVerified,
      isPaidStatus,
      isReassessmentPending,
      canSubmitPaymentReference,
    });
  }

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      setLoading(true);
      const response = await fetch("/api/applicant/top", { cache: "no-store" });
      const data = (await response.json()) as { summary?: TopPageData | null };
      if (active) {
        setTopData(data.summary ?? { activeSummary: null, records: [] });
        setLoading(false);
      }
    }

    void loadSummary();
    return () => {
      active = false;
    };
  }, []);

  async function submitReference() {
    if (!summary) return;

    if (!transactionNumber.trim()) {
      setMessage("OR number is required.");
      return;
    }

    if (!paymentProof) {
      setMessage("Payment proof is required.");
      return;
    }

    const payload = new FormData();
    payload.append("applicationId", summary.applicationId);
    payload.append("orNumber", transactionNumber.trim());
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

    setMessage("OR submission received. BPLO will verify your payment.");
    setTopData((current) => {
      if (!current.activeSummary) return current;

      const nextPaymentReference = {
        id: current.activeSummary.paymentReference?.id,
        transactionNumber: transactionNumber.trim(),
        amountPaid: current.activeSummary.totalAmount,
        paymentDate: new Date().toISOString().slice(0, 10),
        submittedAt: new Date().toISOString(),
        status: "PENDING" as const,
        reviewerRemarks: null,
        reviewedAt: null,
        proofFileName: paymentProof.name,
      };

      return {
        activeSummary: {
          ...current.activeSummary,
          paymentReference: nextPaymentReference,
        },
        records: current.records.map((record) =>
          record.applicationId === current.activeSummary?.applicationId
            ? { ...record, paymentReference: nextPaymentReference }
            : record
        ),
      };
    });
    setTransactionNumber("");
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
              title: "Ready for OR submission",
              description: "This Tax Order of Payment is for permit release payment. Submit the OR number and official receipt or payment proof after payment.",
              variant: "info" as const,
            };

  if (loading) {
    return (
      <section className="ui-page-stack" aria-busy={loading}>
        <PageHeader
          eyebrow="Applicant"
          title="Tax Order of Payment"
          description="Tax Order of Payment for permit release payment."
        />
        <LoadingState message="Loading assessed payment details…" compact />
      </section>
    );
  }

  return (
    <section className="ui-page-stack">
      <PageHeader
        eyebrow="Applicant"
        title="Tax Order of Payment"
        description="Tax Order of Payment for permit release payment."
      />

      {!summary ? (
        <EmptyState
          title="Tax Order of Payment is not yet available"
          description="This page becomes available only after BPLO completes assessment and generates the Tax Order of Payment."
        />
      ) : (
        <div className="space-y-4">
          <SectionCard
            title={`TOP Records (${topData.records.length})`}
            description="Review generated TOP records and the total amount to pay for permit release."
          >
            <div className="space-y-3">
              {topData.records.map((record) => (
                <div key={record.applicationId} className={applicantListCardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-[var(--ink-muted)]">{record.applicationNumber}</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{record.businessName}</p>
                      <p className="ui-caption">TOP: {record.topNumber ?? "Pending TOP Number"}</p>
                      <p className="ui-caption">
                        Total Amount to Pay: ₱ {record.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{record.applicationType}</p>
                      <p className="ui-caption">Status: {record.status}</p>
                    </div>
                      <span className="ui-badge border-[var(--border-color)] bg-[var(--surface)] text-[var(--ink-muted)]">
                      {record.applicationType === "CLOSURE"
                        ? "Full Payment Required"
                        : record.paymentFrequency
                          ? PAYMENT_FREQ_LABELS[record.paymentFrequency] ?? record.paymentFrequency
                          : "No Frequency"}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          </SectionCard>

          {paymentBanner ? (
            <InfoBanner
              title={paymentBanner.title}
              description={paymentBanner.description}
              variant={paymentBanner.variant}
            />
          ) : null}

          <SectionCard
            title="TOP Summary"
            description={`${summary.applicationNumber} • ${summary.applicationType} • ${summary.businessName}`}
          >
            <div className="mb-3 flex items-center justify-end">
              {summary.reassessmentRequestedAt ? (
                <span className="ui-badge bg-[var(--warning-soft)] text-[var(--warning)]">Re-assessment Requested</span>
              ) : canRequestReassessment ? (
                <button
                  type="button"
                  className={actionButtonStyles("secondary", "sm")}
                  onClick={async () => {
                    const ok = confirm("Request re-assessment? BPLO will review your TOP before payment.");
                    if (!ok) return;
                    const res = await fetch(`/api/applicant/applications/${summary.applicationId}/request-reassessment`, { method: "POST" });
                    const data = await res.json();
                    if (!res.ok) {
                      setMessage(data.error ?? "Unable to request reassessment");
                      return;
                    }
                    setMessage(
                      data.message ??
                        "Re-assessment request submitted. Your application has been returned to BPLO Assessment & Fees for review."
                    );
                    setTopData((curr) => ({
                      ...curr,
                      activeSummary: curr.activeSummary ? { ...curr.activeSummary, reassessmentRequestedAt: new Date().toISOString() } : curr.activeSummary,
                      records: curr.records.map((r) => (r.applicationId === summary.applicationId ? { ...r, reassessmentRequestedAt: new Date().toISOString() } : r)),
                    }));
                  }}
                >
                  Request Re-assessment
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`${applicantHighlightPanelClass} border-[var(--success)] bg-[var(--success-soft)]`}>
                <p className={`${applicantSummaryLabelClass} text-[var(--success)]`}>TOP Number</p>
                <p className="mt-1 font-mono text-xl font-semibold text-[var(--foreground)]">
                  {summary.topNumber ?? "Pending TOP Number"}
                </p>
                {summary.generatedAt ? (
                  <p className="mt-1 ui-caption">
                    Generated: {new Date(summary.generatedAt).toLocaleDateString("en-PH")}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                  <div className={applicantSummaryTileClass}>
                    <p className={applicantSummaryLabelClass}>Total Amount to Pay</p>
                    <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                      ₱ {summary.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                <div className={applicantSummaryTileClass}>
                  <p className={applicantSummaryLabelClass}>
                    {summary.applicationType === "CLOSURE" ? "Settlement Payment" : "Mode of Payment"}
                  </p>
                  <p className="mt-1 font-medium text-[var(--foreground)]">
                    {summary.applicationType === "CLOSURE"
                      ? "Full Payment Required"
                      : summary.paymentFrequency
                        ? PAYMENT_FREQ_LABELS[summary.paymentFrequency] ?? summary.paymentFrequency
                        : "-"}
                  </p>
                </div>
                <div className={applicantSummaryTileClass}>
                  <p className={applicantSummaryLabelClass}>TOP Purpose</p>
                  <p className={applicantSummaryValueClass}>
                    Permit release payment
                  </p>
                </div>
                  <div className={`${applicantSummaryTileClass} sm:col-span-2`}>
                  <p className={applicantSummaryLabelClass}>Application Status</p>
                  <p className="mt-1 font-medium text-[var(--foreground)]">{summary.status}</p>
                </div>
              </div>
            </div>
            <p className="mt-3 ui-caption">
              Final verification is performed by BPLO after OR submission.
            </p>
            {summary.applicationType === "CLOSURE" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className={applicantSummaryTileClass}>
                  <p className={applicantSummaryLabelClass}>Closure Certificate Fee</p>
                  <p className="mt-1 font-medium text-[var(--foreground)]">
                    ₱ {summary.closureCertificateFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={applicantSummaryTileClass}>
                  <p className={applicantSummaryLabelClass}>Payment Dues / Pending Fee</p>
                  <p className="mt-1 font-medium text-[var(--foreground)]">
                    ₱ {summary.closurePaymentDues.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={applicantSummaryTileClass}>
                  <p className={applicantSummaryLabelClass}>Total Amount</p>
                  <p className="mt-1 font-semibold text-[var(--foreground)]">
                    ₱ {summary.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Itemized Fees" description="These are the fee items approved in your current Tax Order of Payment.">
            <div className="space-y-3">
              {summary.lineItems.map((item) => (
                <div key={item.id} className={`flex items-center justify-between ${applicantListCardClass} px-4 py-3 text-sm`}>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{item.description}</p>
                    <p className="ui-caption">
                      {item.isSystemGenerated ? "Automatically computed by BPLO rules" : "Included in the approved TOP"}
                    </p>
                  </div>
                  <p className="font-semibold text-[var(--foreground)]">
                    ₱ {item.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
              {summary.closurePaymentDues > 0 ? (
                <div className={`flex items-center justify-between ${applicantListCardClass} px-4 py-3 text-sm`}>
                  <p className="font-medium text-[var(--foreground)]">Closure Payment Dues</p>
                  <p className="font-semibold text-[var(--foreground)]">
                    ₱ {summary.closurePaymentDues.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Submit Payment" description="Submit OR number and proof of payment after paying at the cashier.">
              {isReassessmentPending ? (
                <div className={`mb-4 ${applicantWarningPanelClass} text-sm text-[var(--foreground)]`}>
                  Payment is blocked while BPLO reviews the re-assessment request. Please wait for the updated TOP.
                </div>
              ) : null}

              {/* Existing OR submission status */}
              {paymentRef?.transactionNumber ? (
                <div className={`mb-4 rounded-[var(--radius-card)] border p-4 text-sm ${
                  paymentRefStatus === "VERIFIED"
                    ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--foreground)]"
                    : paymentRefStatus === "REJECTED"
                    ? "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--foreground)]"
                    : "border-[var(--warning)] bg-[var(--warning-soft)] text-[var(--foreground)]"
                }`}>
                  <p className="font-semibold">
                    {paymentRefStatus === "VERIFIED"
                      ? "✅ Payment Verified"
                      : paymentRefStatus === "REJECTED"
                      ? "❌ Payment Rejected — please resubmit with a corrected OR"
                      : "⏳ OR Submitted — Awaiting BPLO Verification"}
                  </p>
                  <p className="mt-1">
                    OR Number: <strong>{paymentRef.transactionNumber}</strong>
                  </p>
                  {paymentRef.reviewerRemarks ? (
                    <p className="mt-1">BPLO Remarks: <strong>{paymentRef.reviewerRemarks}</strong></p>
                  ) : null}
                </div>
              ) : null}

              {/* Show submit form only when submission is allowed */}
              {canSubmitPaymentReference ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]" htmlFor="top-or-number">
                      OR Number / Payment Reference Number
                      <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      id="top-or-number"
                      className={applicantFormControlClass}
                      value={transactionNumber}
                      onChange={(event) => setTransactionNumber(event.target.value)}
                      placeholder="Enter OR number from the cashier receipt"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--foreground)]" htmlFor="top-payment-proof">
                      Official Receipt / Payment Proof
                      <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      id="top-payment-proof"
                      type="file"
                      accept="image/*,application/pdf"
                      className={applicantFormControlClass}
                      onChange={(event) => setPaymentProof(event.target.files?.[0] ?? null)}
                    />
                    <p className="mt-1 ui-caption">Accepted: JPG, PNG, PDF (max 10 MB)</p>
                  </div>
                  <button
                    id="top-submit-payment"
                    type="button"
                    onClick={() => {
                      void submitReference();
                    }}
                    disabled={!transactionNumber.trim() || !paymentProof}
                    className={actionButtonStyles("primary", "md", "w-full")}
                  >
                    Submit Payment
                  </button>
                </div>
              ) : (
                /* Blocked state — show clear reason */
                !isReassessmentPending && !paymentRef ? (
                  <div className={`${applicantPanelClass} text-[var(--ink-muted)]`}>
                    <p className="font-medium text-[var(--foreground)]">Payment submission unavailable</p>
                    <p className="mt-1">
                      {isPaidStatus
                        ? "This application has already been paid and verified."
                        : isPaymentVerified
                        ? "Payment has been verified. No further submission is needed."
                        : `Application must be in 'Approved for Payment' status to submit. Current status: ${summary.status}`}
                    </p>
                  </div>
                ) : null
              )}
          </SectionCard>

          {message ? (
            <InfoBanner title="Submission update" description={message} variant="success" />
          ) : null}
        </div>
      )}
    </section>
  );
}
