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
  businessName: string;
  applicationType: string;
  status: string;
  topNumber: string | null;
  assessmentStatus: "DRAFT" | "GENERATED" | null;
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
  const isPaidStatus = summary?.status === "Paid";
  const canSubmitPaymentReference =
    !!summary && !isPaidStatus && paymentRefStatus !== "PENDING";

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
    if (!summary || !paymentProof) return;

    if (!transactionNumber.trim()) {
      setMessage("Official Receipt Number is required.");
      return;
    }

    const payload = new FormData();
    payload.append("applicationId", summary.applicationId);
    payload.append("transactionNumber", transactionNumber.trim());
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
      <section className="space-y-4" aria-busy={loading}>
        <PageHeader
          eyebrow="Applicant"
          title="Tax Order of Payment"
          description="Tax Order of Payment for permit release payment."
        />
        <SectionCard>
          <p role="status" aria-live="polite" className="text-sm text-slate-500">Loading assessed payment details...</p>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="space-y-4">
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
                <div key={record.applicationId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-slate-600">{record.applicationNumber}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{record.businessName}</p>
                      <p className="text-xs text-slate-500">TOP: {record.topNumber ?? "Pending TOP Number"}</p>
                      <p className="text-xs text-slate-500">
                        Total Amount to Pay: ₱ {record.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{record.applicationType}</p>
                      <p className="text-xs text-slate-500">Status: {record.status}</p>
                    </div>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      {record.paymentFrequency
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
                    <p className="text-xs uppercase tracking-wide text-slate-500">Total Amount to Pay</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      ₱ {summary.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Payment Frequency</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {summary.paymentFrequency
                      ? PAYMENT_FREQ_LABELS[summary.paymentFrequency] ?? summary.paymentFrequency
                      : "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">TOP Purpose</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    Permit release payment
                  </p>
                </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Application Status</p>
                  <p className="mt-1 font-medium text-slate-900">{summary.status}</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Final verification is performed by BPLO after OR submission.
            </p>
            {summary.applicationType === "CLOSURE" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Closure Certificate Fee</p>
                  <p className="mt-1 font-medium text-slate-900">
                    ₱ {summary.closureCertificateFee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Payment Dues / Pending Fee</p>
                  <p className="mt-1 font-medium text-slate-900">
                    ₱ {summary.closurePaymentDues.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total Amount</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    ₱ {summary.totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Itemized Fees" description="These are the fee items approved in your current Tax Order of Payment.">
            <div className="space-y-3">
              {summary.lineItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{item.description}</p>
                    <p className="text-xs text-slate-500">
                      {item.isSystemGenerated ? "Automatically computed by BPLO rules" : "Included in the approved TOP"}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    ₱ {item.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
              {summary.closurePaymentDues > 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="font-medium text-slate-900">Closure Payment Dues</p>
                  <p className="font-semibold text-slate-900">
                    ₱ {summary.closurePaymentDues.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Submit Payment" description="Submit OR details for TOP payment to proceed to permit release.">
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
                    Official Receipt Number
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
                    value={transactionNumber}
                    onChange={(event) => setTransactionNumber(event.target.value)}
                    placeholder="Enter official receipt number"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Official Receipt Upload / Payment Proof
                    <span className="text-red-600">*</span>
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
                  disabled={!transactionNumber.trim() || !paymentProof || !canSubmitPaymentReference}
                  className={actionButtonStyles("primary", "md", "w-full")}
                >
                  Submit Payment
                </button>
                {!canSubmitPaymentReference ? (
                  <p className="text-xs text-slate-500">
                    {isPaidStatus || paymentRefStatus === "VERIFIED"
                      ? "Application is already paid. OR submission is locked."
                      : "An OR submission is pending verification. Please wait for BPLO action."}
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
