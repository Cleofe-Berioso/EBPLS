"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bploFormControlClass,
  bploSummaryLabelClass,
  bploSummaryTileClass,
  bploSummaryValueClass,
  bploListCardClass,
} from "@/components/bplo/bplo-ui-styles";
import { actionButtonStyles } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { LoadingState } from "@/components/ui/loading-state";
import { SectionCard } from "@/components/ui/section-card";
import type { ChecklistItemReadOnlyApiRow } from "@/lib/jit-post-audit-checklist";

interface InspectionReviewRow {
  inspectionId: string;
  businessRecordId: string;
  applicationId: string | null;
  applicationNumber: string;
  permitNumber: string | null;
  businessName: string;
  tradeName: string | null;
  ownerName: string;
  businessType: string;
  lineOfBusiness: string;
  businessAddress: string;
  barangay: string;
  inspectorName: string;
  inspectionDate: string;
  comment: string | null;
  referToBplo: boolean;
  referralReason: string | null;
  referralRemarks: string | null;
  hasEvidence: boolean;
  evidenceFileName: string | null;
  evidenceMimeType: string | null;
  checklistItems: ChecklistItemReadOnlyApiRow[];
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatReferralReason(reason: string | null): string {
  if (!reason) return "N/A";
  return reason
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BploInspectionReviewClient() {
  const [rows, setRows] = useState<InspectionReviewRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [complianceDecision, setComplianceDecision] = useState<"COMPLIANT" | "NON_COMPLIANT" | "">("");
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = useMemo(
    () => rows.find((row) => row.inspectionId === selectedId) ?? null,
    [rows, selectedId]
  );

  async function loadQueue() {
    setLoading(true);
    const response = await fetch("/api/bplo/inspection-review", { cache: "no-store" });
    const data = (await response.json()) as { rows?: InspectionReviewRow[]; error?: string };

    if (!response.ok) {
      setMessage({ type: "error", text: data.error ?? "Unable to load inspection review queue." });
      setRows([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }

    const nextRows = data.rows ?? [];
    setRows(nextRows);
    setSelectedId((current) => {
      if (current && nextRows.some((row) => row.inspectionId === current)) return current;
      return nextRows[0]?.inspectionId ?? null;
    });
    setLoading(false);
  }

  useEffect(() => {
    void loadQueue();
  }, []);

  useEffect(() => {
    setComplianceDecision("");
    setRemarks("");
    setMessage(null);
  }, [selectedId]);

  async function handleReview() {
    if (!selected) return;

    if (!complianceDecision) {
      setMessage({ type: "error", text: "Select a compliance status (Compliant or Non-Compliant)." });
      return;
    }

    if (!remarks.trim()) {
      setMessage({ type: "error", text: "Review remarks are required." });
      return;
    }

    if (!window.confirm(`Mark this inspection as ${complianceDecision} for ${selected.businessName}?`)) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const response = await fetch(`/api/bplo/inspection-review/${selected.inspectionId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complianceStatus: complianceDecision,
        remarks: remarks.trim(),
      }),
    });

    const data = (await response.json()) as {
      result?: { complianceStatus: string };
      error?: string;
    };

    if (!response.ok) {
      setMessage({ type: "error", text: data.error ?? "Unable to submit review." });
      setSubmitting(false);
      return;
    }

    setMessage({
      type: "success",
      text: `Inspection marked as ${complianceDecision}. It will proceed to Department Head verification.`,
    });
    setComplianceDecision("");
    setRemarks("");
    setSubmitting(false);
    await loadQueue();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard
        title="Pending Compliance Review"
        description="JIT inspections awaiting BPLO compliance determination."
      >
        {loading ? (
          <LoadingState message="Loading review queue…" compact />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No inspections pending review"
            description="JIT inspections with PENDING_REVIEW status will appear here."
          />
        ) : (
          <div className="space-y-2">
            {rows.map((row) => {
              const active = selectedId === row.inspectionId;
              return (
                <button
                  key={row.inspectionId}
                  type="button"
                  onClick={() => setSelectedId(row.inspectionId)}
                  className={`${bploListCardClass} w-full text-left transition-all ${
                    active
                      ? "ring-2 ring-[var(--primary)] ring-offset-1"
                      : "hover:border-[var(--primary)]"
                  }`}
                >
                  <p className="font-mono text-xs text-[var(--ink-muted)]">{row.applicationNumber}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                    {row.tradeName ? `${row.businessName} / ${row.tradeName}` : row.businessName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">
                    Inspector: {row.inspectorName}
                  </p>
                  {row.referToBplo && (
                    <span className="mt-1 inline-block rounded-full bg-[var(--warning-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--warning)]">
                      Referred
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Compliance Review"
        description={
          selected
            ? `${selected.applicationNumber} • ${selected.businessName}`
            : "Select an inspection to review."
        }
      >
        {!selected ? (
          <EmptyState
            title="No selected inspection"
            description="Choose one inspection from the queue."
          />
        ) : (
          <div className="space-y-4">
            {/* Business info grid */}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className={bploSummaryTileClass}>
                <p className={bploSummaryLabelClass}>Business Name / Trade</p>
                <p className={bploSummaryValueClass}>
                  {selected.tradeName
                    ? `${selected.businessName} / ${selected.tradeName}`
                    : selected.businessName}
                </p>
              </div>
              <div className={bploSummaryTileClass}>
                <p className={bploSummaryLabelClass}>Permit No.</p>
                <p className={bploSummaryValueClass}>{selected.permitNumber ?? "N/A"}</p>
              </div>
              <div className={bploSummaryTileClass}>
                <p className={bploSummaryLabelClass}>Business Type</p>
                <p className={bploSummaryValueClass}>{selected.businessType}</p>
              </div>
              <div className={bploSummaryTileClass}>
                <p className={bploSummaryLabelClass}>Owner</p>
                <p className={bploSummaryValueClass}>{selected.ownerName}</p>
              </div>
              <div className={bploSummaryTileClass}>
                <p className={bploSummaryLabelClass}>Line of Business</p>
                <p className={bploSummaryValueClass}>{selected.lineOfBusiness}</p>
              </div>
              <div className={bploSummaryTileClass}>
                <p className={bploSummaryLabelClass}>Address</p>
                <p className={bploSummaryValueClass}>{selected.businessAddress}</p>
              </div>
              <div className={bploSummaryTileClass}>
                <p className={bploSummaryLabelClass}>Inspection Date</p>
                <p className={bploSummaryValueClass}>{formatDateTime(selected.inspectionDate)}</p>
              </div>
              <div className={bploSummaryTileClass}>
                <p className={bploSummaryLabelClass}>Inspector</p>
                <p className={bploSummaryValueClass}>{selected.inspectorName}</p>
              </div>
            </div>

            {/* Referral banner */}
            {selected.referToBplo && (
              <InfoBanner
                title="JIT Referral"
                description={`Reason: ${formatReferralReason(selected.referralReason)}${selected.referralRemarks ? `. ${selected.referralRemarks}` : ""}`}
                variant="warning"
              />
            )}

            {/* JIT remarks */}
            <div className={bploSummaryTileClass}>
              <p className={bploSummaryLabelClass}>JIT Inspection Remarks</p>
              <p className="mt-1 text-sm text-[var(--foreground)]">
                {selected.comment ?? "No remarks provided."}
              </p>
            </div>

            {/* Checklist read-only */}
            <SectionCard
              title="JIT Post-Audit Checklist"
              description="Read-only checklist responses submitted by JIT."
            >
              {selected.checklistItems.length === 0 ? (
                <p className="text-sm text-[var(--ink-muted)]">No checklist submitted.</p>
              ) : (
                <div className="space-y-2">
                  {selected.checklistItems.map((item) => (
                    <div key={item.id} className={bploListCardClass}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[var(--primary)]">
                            {item.departmentLabel}
                          </p>
                          <p className="mt-1 text-sm text-[var(--foreground)]">{item.question}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.responseLabel === "Yes" || item.responseLabel === "Compliant"
                              ? "bg-[var(--success-soft)] text-[var(--success)]"
                              : item.responseLabel === "No" || item.responseLabel === "Non-Compliant"
                                ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                                : "bg-[var(--muted-surface)] text-[var(--ink-muted)]"
                          }`}
                        >
                          {item.responseLabel}
                        </span>
                      </div>
                      {item.remarks && (
                        <p className="mt-2 text-xs text-[var(--ink-muted)]">
                          Remarks: {item.remarks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Evidence */}
            {selected.hasEvidence && (
              <div className={bploSummaryTileClass}>
                <p className={bploSummaryLabelClass}>Inspection Evidence</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">
                  {selected.evidenceFileName ?? "Evidence attached"}
                </p>
              </div>
            )}

            {/* Compliance decision form */}
            <div className="space-y-3 rounded-xl border-2 border-[var(--primary)] bg-[var(--info-soft)] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">BPLO Compliance Decision</p>
              <p className="text-xs text-[var(--ink-muted)]">
                Based on the JIT checklist, remarks, and evidence, determine the official compliance status.
              </p>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Compliance Status <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  value={complianceDecision}
                  onChange={(e) => setComplianceDecision(e.target.value as "COMPLIANT" | "NON_COMPLIANT" | "")}
                  disabled={submitting}
                  className={bploFormControlClass}
                >
                  <option value="">-- Select compliance status --</option>
                  <option value="COMPLIANT">Compliant</option>
                  <option value="NON_COMPLIANT">Non-Compliant</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Review Remarks <span className="text-[var(--danger)]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={submitting}
                  className={bploFormControlClass}
                  placeholder="Provide compliance review remarks"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleReview()}
                disabled={submitting}
                className={actionButtonStyles("primary", "md")}
              >
                {submitting ? "Submitting…" : "Submit Compliance Decision"}
              </button>
            </div>

            {message && (
              <InfoBanner
                title={message.type === "success" ? "Review completed" : "Review blocked"}
                description={message.text}
                variant={message.type === "success" ? "success" : "danger"}
              />
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
