"use client";

import { useEffect, useMemo, useState } from "react";
import { actionButtonStyles } from "@/components/ui/action-button";
import { DetailHeader } from "@/components/ui/detail-header";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveDataTable } from "@/components/ui/responsive-data-table";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";

type PaymentStatus = "PENDING" | "VERIFIED" | "REJECTED";

interface PaymentVerificationRow {
  paymentReferenceId: string;
  applicationId: string;
  applicationNumber: string;
  businessName: string;
  applicantName: string;
  applicantEmail: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  topNumber: string | null;
  annualAssessedAmount: number;
  releasePaymentAmount: number;
  totalAmountDue: number;
  amountPaid: number;
  paymentDate: string;
  transactionNumber: string;
  submittedAt: string;
  paymentStatus: PaymentStatus;
  applicationStatus: string;
  reviewerRemarks: string | null;
  reviewedAt: string | null;
  proofFileName: string;
}

interface PaymentVerificationDetail {
  row: PaymentVerificationRow;
  applicant: { id: string; name: string; email: string };
  business: {
    businessName: string;
    businessType: string;
    lineOfBusiness: string;
    assetSize: string;
    totalEmployees: string;
  };
  top: {
    assessmentNumber: string | null;
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
  };
}

interface VerificationLists {
  pending: PaymentVerificationRow[];
  verified: PaymentVerificationRow[];
  rejected: PaymentVerificationRow[];
}

type TabKey = "PENDING" | "VERIFIED" | "REJECTED";

function money(value: number): string {
  return `₱ ${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function passFailLabel(status: PaymentStatus): "Pass" | "Fail" | "Pending" {
  if (status === "VERIFIED") return "Pass";
  if (status === "REJECTED") return "Fail";
  return "Pending";
}

export default function BploPaymentVerificationPage() {
  const [lists, setLists] = useState<VerificationLists>({
    pending: [],
    verified: [],
    rejected: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("PENDING");
  const [selectedRefId, setSelectedRefId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PaymentVerificationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  async function loadLists() {
    setLoading(true);
    const response = await fetch("/api/bplo/payment-verification", { cache: "no-store" });
    const data = (await response.json()) as VerificationLists & { error?: string };
    if (!response.ok) {
      setStatusMessage({ kind: "error", text: data.error ?? "Unable to load payments." });
      setLoading(false);
      return;
    }
    setLists(data);
    setLoading(false);
  }

  async function loadDetail(paymentReferenceId: string) {
    setSelectedRefId(paymentReferenceId);
    setDetailLoading(true);
    setStatusMessage(null);

    const response = await fetch(`/api/bplo/payment-verification/${paymentReferenceId}`, {
      cache: "no-store",
    });
    const data = (await response.json()) as { detail?: PaymentVerificationDetail; error?: string };

    if (!response.ok || !data.detail) {
      setDetail(null);
      setStatusMessage({ kind: "error", text: data.error ?? "Unable to load payment detail." });
      setDetailLoading(false);
      return;
    }

    setDetail(data.detail);
    setRemarks(data.detail.row.reviewerRemarks ?? "");
    setDetailLoading(false);
  }

  useEffect(() => {
    void loadLists();
  }, []);

  const rows = useMemo(() => {
    if (activeTab === "PENDING") return lists.pending;
    if (activeTab === "VERIFIED") return lists.verified;
    return lists.rejected;
  }, [activeTab, lists.pending, lists.verified, lists.rejected]);

  const isUnderpaid =
    detail ? detail.row.amountPaid < detail.top.releasePaymentAmount : false;

  async function verifySelected() {
    if (!detail || detail.row.paymentStatus !== "PENDING") return;

    setActionBusy(true);
    setStatusMessage(null);
    const response = await fetch(
      `/api/bplo/payment-verification/${detail.row.paymentReferenceId}/approve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks: remarks.trim() || undefined }),
      }
    );
    const data = (await response.json()) as {
      error?: string;
      result?: { releasePaymentAmount?: number; amountPaid?: number; remainingBalance?: number };
    };
    if (!response.ok) {
      setStatusMessage({ kind: "error", text: data.error ?? "Unable to verify payment." });
      setActionBusy(false);
      return;
    }

    const warning =
      typeof data.result?.releasePaymentAmount === "number" &&
      typeof data.result.amountPaid === "number"
        ? ` Verified payment ${money(data.result.amountPaid)} against required release payment ${money(data.result.releasePaymentAmount)}.`
        : "";

    setStatusMessage({
      kind: "ok",
      text: `Payment verified successfully. Application moved to Paid.${warning}`,
    });

    await loadLists();
    if (selectedRefId) {
      await loadDetail(selectedRefId);
    }
    setActionBusy(false);
  }

  async function rejectSelected() {
    if (!detail || detail.row.paymentStatus !== "PENDING") return;
    if (!remarks.trim()) {
      setStatusMessage({ kind: "error", text: "Remarks are required when rejecting a payment." });
      return;
    }

    setActionBusy(true);
    setStatusMessage(null);
    const response = await fetch(
      `/api/bplo/payment-verification/${detail.row.paymentReferenceId}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks: remarks.trim() }),
      }
    );
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatusMessage({ kind: "error", text: data.error ?? "Unable to reject payment." });
      setActionBusy(false);
      return;
    }

    setStatusMessage({
      kind: "ok",
      text: "Payment rejected. Application remains Approved for Payment and applicant can resubmit.",
    });

    await loadLists();
    if (selectedRefId) {
      await loadDetail(selectedRefId);
    }
    setActionBusy(false);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="BPLO"
        title="Payment Verification"
        description="Verify applicant-submitted payment references for applications in Approved for Payment status."
        badge={<RoleBadge role="BPLO" />}
      />

      <SectionCard title="Verification Buckets" description="Separate queues for pending, verified, and rejected payment references.">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={activeTab === "PENDING" ? actionButtonStyles("warning", "sm") : actionButtonStyles("secondary", "sm")}
          >
            Pending Verification ({lists.pending.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("VERIFIED")}
            className={activeTab === "VERIFIED" ? actionButtonStyles("primary", "sm") : actionButtonStyles("secondary", "sm")}
          >
            Verified Payments ({lists.verified.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("REJECTED")}
            className={activeTab === "REJECTED" ? actionButtonStyles("danger", "sm") : actionButtonStyles("secondary", "sm")}
          >
            Rejected Payments ({lists.rejected.length})
          </button>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <ResponsiveDataTable
          title="Payment Queue"
          description={loading ? "Loading submitted payment references..." : `${rows.length} record${rows.length === 1 ? "" : "s"} in the selected section.`}
          table={
            loading ? (
              <div className="px-6 py-8 text-sm text-slate-500">Loading payment references for BPLO review...</div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">No records available yet in this section. Submitted payment references will appear here when available.</div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-700">
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Application Number</th>
                  <th className="px-3 py-2 font-semibold">OR Number</th>
                  <th className="px-3 py-2 font-semibold">Remark</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.paymentReferenceId} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.paymentStatus === "PENDING"
                            ? "border border-amber-200 bg-amber-50 text-amber-800"
                            : row.paymentStatus === "VERIFIED"
                              ? "border border-green-200 bg-green-50 text-green-700"
                              : "border border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.applicationNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{row.transactionNumber}</td>
                    <td className="px-3 py-2 text-slate-700">{passFailLabel(row.paymentStatus)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          void loadDetail(row.paymentReferenceId);
                        }}
                        className={actionButtonStyles("secondary", "sm")}
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )
          }
          mobile={
            loading ? (
              <div className="p-4 text-sm text-slate-500">Loading payment references for BPLO review...</div>
            ) : rows.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No records available yet in this section.</div>
            ) : (
              <div className="space-y-3 p-4">
                {rows.map((row) => (
                  <article key={row.paymentReferenceId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">OR: {row.transactionNumber}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          row.paymentStatus === "PENDING"
                            ? "border border-amber-200 bg-amber-50 text-amber-800"
                            : row.paymentStatus === "VERIFIED"
                              ? "border border-green-200 bg-green-50 text-green-700"
                              : "border border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {row.paymentStatus}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Remark: {passFailLabel(row.paymentStatus)}</p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          void loadDetail(row.paymentReferenceId);
                        }}
                        className={actionButtonStyles("secondary", "sm")}
                      >
                        Verify
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          }
        />

        <SectionCard title="Payment Detail" description="Review payment reference details and apply BPLO verification actions using existing workflow rules.">
          {!selectedRefId ? (
            <div className="text-sm text-slate-500">Select a payment reference from the queue to review the TOP, applicant details, and BPLO action area.</div>
          ) : detailLoading ? (
            <div className="text-sm text-slate-500">Loading payment reference details...</div>
          ) : !detail ? (
            <div className="text-sm text-slate-500">Unable to load the selected payment reference details.</div>
          ) : (
            <div className="space-y-4">
              <DetailHeader
                title="Selected Payment Reference"
                subtitle={`${detail.row.applicationNumber} • ${detail.row.transactionNumber}`}
                badge={
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      detail.row.paymentStatus === "PENDING"
                        ? "border border-amber-200 bg-amber-50 text-amber-800"
                        : detail.row.paymentStatus === "VERIFIED"
                          ? "border border-green-200 bg-green-50 text-green-700"
                          : "border border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {detail.row.paymentStatus}
                  </span>
                }
              />

              {detail.row.paymentStatus === "REJECTED" ? (
                <InfoBanner
                  title="Rejected payment reference"
                  description={
                    detail.row.reviewerRemarks
                      ? `Previous BPLO remarks: ${detail.row.reviewerRemarks}`
                      : "This payment reference was rejected and the applicant may submit a corrected one."
                  }
                  variant="danger"
                />
              ) : null}

              {detail.row.paymentStatus === "PENDING" && isUnderpaid ? (
                <InfoBanner
                  title="Underpaid amount detected"
                  description={`Submitted payment is ${money(detail.row.amountPaid)} while required release payment is ${money(detail.top.releasePaymentAmount)}.`}
                  variant="warning"
                />
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                <SummaryTile
                  label="Application Number"
                  value={detail.row.applicationNumber}
                  helper="Linked application record"
                />
                <SummaryTile
                  label="OR Number / eGov Transaction Number"
                  value={detail.row.transactionNumber}
                  helper="Submitted payment reference identifier"
                />
                <SummaryTile
                  label="Verification Result"
                  value={passFailLabel(detail.row.paymentStatus)}
                  helper="Pass for verified, Fail for rejected, Pending when under review"
                />
              </div>

              <p className="text-xs text-slate-500">
                Payment proof submitted by the applicant: {detail.row.proofFileName}
              </p>
              <a
                href={`/api/bplo/payment-verification/${detail.row.paymentReferenceId}/proof`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Download Payment Proof
              </a>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">BPLO Review Action</p>
                <p className="mt-1 text-sm text-slate-600">
                  Add remarks for verification notes. Remarks are required when rejecting a payment reference.
                </p>
                <FormField
                  label="BPLO Remarks"
                  hint="Required when rejecting; optional for approval notes."
                >
                  <textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none read-only:border-slate-300 read-only:bg-slate-100 read-only:text-slate-800"
                    placeholder="Add verification notes or rejection reason"
                    readOnly={detail.row.paymentStatus !== "PENDING" || actionBusy}
                  />
                </FormField>

                {detail.row.paymentStatus === "PENDING" ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void verifySelected();
                      }}
                      disabled={actionBusy}
                      className={actionButtonStyles("primary", "md")}
                    >
                      Approve / Verify Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void rejectSelected();
                      }}
                      disabled={actionBusy}
                      className={actionButtonStyles("danger", "md")}
                    >
                      Reject Payment
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    This payment reference is already {detail.row.paymentStatus.toLowerCase()} and is now read-only.
                  </p>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {statusMessage ? (
        <InfoBanner
          title={statusMessage.kind === "error" ? "Verification error" : "Verification update"}
          description={statusMessage.text}
          variant={statusMessage.kind === "error" ? "danger" : "success"}
        />
      ) : null}
    </section>
  );
}
