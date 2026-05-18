"use client";

import { useEffect, useMemo, useState } from "react";
import { actionButtonStyles } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";

type SettlementRow = {
  inspectionId: string;
  businessRecordId: string;
  applicationId: string | null;
  applicationNumber: string | null;
  permitOrCertificateNumber: string | null;
  businessName: string;
  tradeName: string | null;
  ownerName: string;
  applicantName: string;
  businessAddress: string;
  lineOfBusiness: string;
  nonComplianceType: string | null;
  violationSeverity: string | null;
  complianceCaseStatus: string;
  inspectionRemarks: string | null;
  verificationRemarks: string | null;
  verifiedAt: string | null;
  deadlineAt: string | null;
};

function formatDateTime(value: string | null): string {
  if (!value || value === "-") return "-";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function SettlementManagementClient() {
  const [rows, setRows] = useState<SettlementRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarksInput, setRemarksInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selected = useMemo(() => rows.find((row) => row.inspectionId === selectedId) ?? null, [rows, selectedId]);

  async function loadRows() {
    try {
      setLoading(true);
      const response = await fetch("/api/department-head/settlement-management", { cache: "no-store" });
      const data = (await response.json()) as { rows?: SettlementRow[]; error?: string };

      if (!response.ok) {
        setMessage({ type: "error", text: data.error ?? "Unable to load settlement cases." });
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
    } catch (err) {
      setMessage({ type: "error", text: "Unable to load settlement cases." });
      setRows([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, []);

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard title="Eligible Cases" description="Cases eligible for Department Head settlement.">
        {loading ? (
          <div className="text-sm text-slate-500">Loading eligible cases...</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">No eligible settlement cases found.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => {
              const active = selectedId === row.inspectionId;
              return (
                <button
                  key={row.inspectionId}
                  type="button"
                  onClick={() => setSelectedId(row.inspectionId)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    active ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="font-mono text-xs text-slate-600">{row.applicationNumber ?? row.inspectionId}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                  <p className="mt-1 text-xs text-slate-600">{row.applicantName}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700`}>Flagged / Unsettled</span>
                    <span className="text-xs text-slate-500">{row.violationSeverity ? row.violationSeverity : "-"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Case Details" description={selected ? `${selected.applicationNumber ?? selected.inspectionId} • ${selected.businessName}` : "Select a case from the list."}>
        {!selected ? (
          <EmptyState title="No selected case" description="Choose an eligible case from the list." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Business Name</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.businessName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Owner / Applicant</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.ownerName}</p>
                <p className="text-xs text-slate-600">Applicant: {selected.applicantName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Application / Permit</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.applicationNumber ?? "N/A"}</p>
                <p className="text-xs text-slate-600">Permit: {selected.permitOrCertificateNumber ?? "N/A"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Business Address</p>
                <p className="mt-1 text-sm text-slate-900">{selected.businessAddress}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Severity</p>
                <p className="mt-1 text-sm text-slate-900">{selected.violationSeverity === "MINOR" ? "Minor" : selected.violationSeverity === "MAJOR" ? "Major" : "-"}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Case Status</p>
                <p className="mt-1 text-sm text-slate-900">Flagged / Unsettled</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Inspection Remarks</p>
                <p className="mt-1 text-sm text-slate-900">{selected.inspectionRemarks ?? "No comment provided."}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Department Head Verification Remarks</p>
                <p className="mt-1 text-sm text-slate-900">{selected.verificationRemarks ?? "No remarks recorded."}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Verified Date</p>
                <p className="mt-1 text-sm text-slate-900">{formatDateTime(selected.verifiedAt)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Deadline</p>
                <p className="mt-1 text-sm text-slate-900">{formatDateTime(selected.deadlineAt)}</p>
              </div>
            </div>

            <SectionCard title="Actions" description="Settle eligible cases here.">
              <p className="text-sm text-slate-600">Only Minor or Major government-agency-related cases can be settled. Settlement does not reactivate permits or change payments.</p>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className={actionButtonStyles("danger", "md")}
                  onClick={() => {
                    setRemarksInput("");
                    setIsModalOpen(true);
                  }}
                >
                  Mark as Settled
                </button>
              </div>

              {isModalOpen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
                  <div className="relative w-[720px] rounded-lg bg-white p-6 shadow-lg">
                    <h3 className="text-lg font-semibold">Mark as Settled</h3>
                    <p className="mt-2 text-sm text-slate-600">Provide settlement remarks (required).</p>
                    <textarea
                      value={remarksInput}
                      onChange={(e) => setRemarksInput(e.target.value)}
                      className="mt-3 w-full rounded-md border p-2 text-sm"
                      rows={5}
                      placeholder="Enter settlement remarks"
                    />
                    <div className="mt-4 flex justify-end gap-3">
                      <button type="button" className={actionButtonStyles("secondary", "sm")} onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={actionButtonStyles("danger", "sm")}
                        onClick={async () => {
                          const remarks = remarksInput.trim();
                          if (!remarks) {
                            setMessage({ type: "error", text: "Settlement remarks are required." });
                            return;
                          }
                          if (!selected) return;
                          try {
                            setIsSubmitting(true);
                            const res = await fetch(`/api/department-head/settlement-management/${selected.inspectionId}/settle`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ settlementRemarks: remarks }),
                            });
                            const data = await res.json();
                            if (!res.ok) {
                              setMessage({ type: "error", text: data.error ?? "Unable to mark as settled." });
                              return;
                            }
                            setIsModalOpen(false);
                            await loadRows();
                            setMessage(null);
                          } catch (err) {
                            setMessage({ type: "error", text: "Unable to mark as settled." });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </SectionCard>
          </div>
        )}

        {message ? (
          <div className="mt-4">
            <InfoBanner title="Action failed" description={message.text} variant="danger" />
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
