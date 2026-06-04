"use client";

import { useEffect, useMemo, useState } from "react";
import { actionButtonStyles } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";

type PermitToRevokeRow = {
  inspectionId: string;
  businessRecordId: string;
  applicationId: string;
  applicationNumber: string;
  permitOrCertificateNumber: string | null;
  businessName: string;
  tradeName: string | null;
  businessType: string;
  ownerName: string;
  applicantName: string;
  businessAddress: string;
  lineOfBusiness: string;
  inspectionDate: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  inspectorName: string;
  inspectorComment: string | null;
  evidenceFileName: string | null;
  evidenceMimeType: string | null;
  hasEvidence: boolean;
  inspectionStatus: string;
  applicationStatus: string;
};

type DecisionAction = "approve" | "deny";

function formatDateTime(value: string): string {
  if (!value || value === "-") return "-";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

/** UI-only risk level — no Prisma field needed */
function computeRiskLevel(inspectionStatus: string, applicationStatus: string): { label: string; className: string } {
  const status = inspectionStatus.toUpperCase();
  if (status === "REVOCATION_REVIEW" || status === "REVOKED") {
    return { label: "High Risk", className: "text-red-700 bg-red-50 border-red-200" };
  }
  if (status === "NON_COMPLIANT" || applicationStatus.toUpperCase().includes("REVOCATION")) {
    return { label: "Medium Risk", className: "text-orange-700 bg-orange-50 border-orange-200" };
  }
  return { label: "Low Risk", className: "text-emerald-700 bg-emerald-50 border-emerald-200" };
}

export function PermitToRevokeClient() {
  const [rows, setRows] = useState<PermitToRevokeRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<DecisionAction | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = useMemo(
    () => rows.find((row) => row.inspectionId === selectedId) ?? null,
    [rows, selectedId]
  );

  const selectedEvidenceUrl = selected ? `/api/department-head/permit-to-revoke/${selected.inspectionId}/evidence` : "";
  const selectedEvidenceFileName = selected?.evidenceFileName ?? "";
  const selectedEvidenceIsImage = Boolean(selected?.evidenceMimeType?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(selectedEvidenceFileName));
  const selectedEvidenceIsPdf = Boolean(selected?.evidenceMimeType === "application/pdf" || /\.pdf$/i.test(selectedEvidenceFileName));

  async function loadQueue() {
    setLoading(true);
    const response = await fetch("/api/department-head/permit-to-revoke", { cache: "no-store" });
    const data = (await response.json()) as { rows?: PermitToRevokeRow[]; error?: string };

    if (!response.ok) {
      setMessage({ type: "error", text: data.error ?? "Unable to load revocation review queue." });
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
    setEvidenceOpen(false);
  }, [selectedId]);

  async function runDecision(action: DecisionAction) {
    if (!selected) return;

    if (!remarks.trim()) {
      setMessage({ type: "error", text: "Remarks are required for approve or deny decision." });
      return;
    }

    setPendingAction(action);
    setMessage(null);

    let response: Response;
    try {
      response = await fetch(
        `/api/department-head/permit-to-revoke/${selected.inspectionId}/${action === "approve" ? "approve-revocation" : "deny-revocation"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remarks }),
        }
      );
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to update revocation status.",
      });
      setPendingAction(null);
      return;
    }

    const rawBody = await response.text();
    let data: {
      result?: { applicationNumber: string; applicationStatus: string };
      error?: string;
    } = {};

    if (rawBody) {
      try {
        data = JSON.parse(rawBody) as typeof data;
      } catch {
        data = { error: rawBody };
      }
    }

    if (!response.ok) {
      // Show the exact error reason returned by the API so the DH knows what to fix
      const reason = data.error ?? response.statusText ?? "Unable to process revocation decision.";
      setMessage({ type: "error", text: reason });
      setPendingAction(null);
      return;
    }

    const appNumber = data.result?.applicationNumber ?? "Application";
    const newStatus = data.result?.applicationStatus ?? "updated status";
    const successText =
      action === "approve"
        ? `Revocation approved successfully. ${appNumber} has been moved to ${newStatus}.`
        : `Revocation denied successfully. ${appNumber} has been restored to ${newStatus}.`;

    setMessage({ type: "success", text: successText });
    setRemarks("");
    setPendingAction(null);
    await loadQueue();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard
        title="Flagged Cases Queue"
        description="Only Department Head verified NON_COMPLIANT inspections ready for revocation decision are listed here."
      >
        {loading ? (
          <div className="text-sm text-slate-500">Loading revocation queue...</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            No inspections are waiting for revocation decision.
          </div>
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
                    active
                      ? "border-amber-300 bg-amber-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{row.tradeName ? `${row.businessName} / ${row.tradeName}` : row.businessName}</p>
                  <p className="mt-1 text-xs text-slate-600">Inspector: {row.inspectorName}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">{row.inspectionStatus}</p>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Flagged Case Decision"
        description={selected ? `${selected.applicationNumber} • ${selected.businessName}` : "Select a flagged case."}
      >
        {!selected ? (
          <EmptyState title="No selected inspection" description="Choose an inspection from the queue." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Business Name / Trade Name</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.tradeName ? `${selected.businessName} / ${selected.tradeName}` : selected.businessName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Business Type</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.businessType}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Owner / Applicant</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.ownerName}</p>
                <p className="text-xs text-slate-600">Applicant: {selected.applicantName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Application / Permit</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.applicationNumber}</p>
                <p className="text-xs text-slate-600">Permit: {selected.permitOrCertificateNumber ?? "N/A"}</p>
              </div>
              <div className={`rounded-xl border p-3 ${computeRiskLevel(selected.inspectionStatus, selected.applicationStatus).className}`}>
                <p className="text-xs uppercase tracking-wide opacity-70">Risk Level</p>
                <p className="mt-1 text-sm font-bold">{computeRiskLevel(selected.inspectionStatus, selected.applicationStatus).label}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Business Address</p>
                <p className="mt-1 text-sm text-slate-900">{selected.businessAddress}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Line of Business</p>
                <p className="mt-1 text-sm text-slate-900">{selected.lineOfBusiness}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">JIT Inspection Date</p>
                <p className="mt-1 text-sm text-slate-900">{formatDateTime(selected.inspectionDate)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Date Verified</p>
                <p className="mt-1 text-sm text-slate-900">{selected.verifiedAt ? formatDateTime(selected.verifiedAt) : "Not available"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Verified By</p>
                <p className="mt-1 text-sm text-slate-900">{selected.verifiedBy ?? "Not available"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">JIT Inspector</p>
                <p className="mt-1 text-sm text-slate-900">{selected.inspectorName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Current Status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.inspectionStatus}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">JIT Comment</p>
                <p className="mt-1 text-sm text-slate-900">{selected.inspectorComment ?? "No comment provided."}</p>
              </div>
            </div>

            <SectionCard title="Photo Evidence" description="Uploaded JIT evidence for this revocation review.">
              {!selected.hasEvidence ? (
                <div className="text-sm text-slate-600">No evidence uploaded.</div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">{selected.evidenceFileName ?? "Evidence"}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEvidenceOpen(true)}
                      className={actionButtonStyles("secondary", "sm")}
                    >
                      View Evidence
                    </button>
                    <a
                      href={selectedEvidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={actionButtonStyles("secondary", "sm")}
                    >
                      Open in New Tab
                    </a>
                  </div>
                </div>
              )}
            </SectionCard>

            {selected?.hasEvidence && evidenceOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
                <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Evidence Preview</p>
                      <p className="text-xs text-slate-600">{selected.evidenceFileName ?? "Uploaded evidence"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEvidenceOpen(false)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-[calc(90vh-72px)] overflow-auto bg-slate-100 p-4">
                    {selectedEvidenceIsImage ? (
                      <img
                        src={selectedEvidenceUrl}
                        alt="Inspection evidence"
                        className="mx-auto max-h-[75vh] w-full max-w-full rounded-2xl border border-slate-200 object-contain bg-white"
                      />
                    ) : selectedEvidenceIsPdf ? (
                      <iframe
                        src={selectedEvidenceUrl}
                        title="Inspection evidence preview"
                        className="h-[75vh] w-full rounded-2xl border border-slate-200 bg-white"
                      />
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                        Preview unavailable for this file type.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="revocation-remarks">
                Department Head Remarks (required)
              </label>
              <textarea
                id="revocation-remarks"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                rows={3}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Enter decision remarks"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void runDecision("approve")}
                disabled={pendingAction !== null}
                className={actionButtonStyles("danger", "sm")}
              >
                {pendingAction === "approve" ? "Processing..." : "Approve Revocation"}
              </button>
              <button
                type="button"
                onClick={() => void runDecision("deny")}
                disabled={pendingAction !== null}
                className={actionButtonStyles("secondary", "sm")}
              >
                {pendingAction === "deny" ? "Processing..." : "Deny Revocation"}
              </button>
            </div>

            {message ? (
              <InfoBanner
                title={message.type === "success" ? "Decision completed" : "Approval failed"}
                description={message.text}
                variant={message.type === "success" ? "success" : "danger"}
              />
            ) : null}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
