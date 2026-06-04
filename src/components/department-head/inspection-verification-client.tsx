"use client";

import { useEffect, useMemo, useState } from "react";
import { actionButtonStyles } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";

type InspectionVerificationRow = {
  inspectionId: string;
  businessRecordId: string;
  applicationId: string;
  applicationNumber: string;
  permitOrCertificateNumber: string | null;
  businessName: string;
  tradeName: string | null;
  ownerName: string;
  applicantName: string;
  businessAddress: string;
  businessType: string;
  lineOfBusiness: string;
  inspectionDate: string;
  inspectorName: string;
  inspectionStatus: string;
  complianceStatus: "COMPLIANT" | "NON_COMPLIANT";
  inspectorComment: string | null;
  evidenceFileName: string | null;
  evidenceMimeType: string | null;
  hasEvidence: boolean;
  applicationStatus: string;
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

const NON_COMPLIANCE_TYPE_OPTIONS = [
  { value: "GOVERNMENT_AGENCY_RELATED", label: "Government Agency Related" },
  { value: "RENEWAL_RELATED", label: "Renewal Related" },
];

const VIOLATION_SEVERITY_OPTIONS = [
  { value: "MINOR", label: "Minor" },
  { value: "MAJOR", label: "Major" },
  { value: "SEVERE", label: "Severe" },
];

const HELPER_TEXT = {
  GOVERNMENT_AGENCY_RELATED: "Minor or major cases may be flagged for settlement. Severe cases may require forced closure processing.",
  RENEWAL_RELATED: "Renewal may continue later, but renewal-related penalties or fees may apply during assessment.",
};

export function DepartmentHeadInspectionVerificationClient() {
  const [rows, setRows] = useState<InspectionVerificationRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [nonComplianceType, setNonComplianceType] = useState("");
  const [violationSeverity, setViolationSeverity] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = useMemo(
    () => rows.find((row) => row.inspectionId === selectedId) ?? null,
    [rows, selectedId]
  );

  const isNonCompliant = selected?.complianceStatus === "NON_COMPLIANT";

  async function loadQueue() {
    setLoading(true);
    const response = await fetch("/api/department-head/inspection-verification", { cache: "no-store" });
    const data = (await response.json()) as { rows?: InspectionVerificationRow[]; error?: string };

    if (!response.ok) {
      setMessage({ type: "error", text: data.error ?? "Unable to load inspection verification queue." });
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

  // Reset classification fields when selection changes
  useEffect(() => {
    setNonComplianceType("");
    setViolationSeverity("");
    setRemarks("");
    setMessage(null);
    setEvidenceOpen(false);
  }, [selectedId]);

  const selectedEvidenceUrl = selected ? `/api/department-head/inspection-verification/${selected.inspectionId}/evidence` : "";
  const selectedEvidenceFileName = selected?.evidenceFileName ?? "";
  const selectedEvidenceIsImage = Boolean(selected?.evidenceMimeType?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(selectedEvidenceFileName));
  const selectedEvidenceIsPdf = Boolean(selected?.evidenceMimeType === "application/pdf" || /\.pdf$/i.test(selectedEvidenceFileName));

  async function handleVerify() {
    if (!selected) return;

    if (!remarks.trim()) {
      setMessage({ type: "error", text: "Verification remarks are required." });
      return;
    }

    // Validate classification fields for NON_COMPLIANT
    if (isNonCompliant) {
      if (!nonComplianceType) {
        setMessage({ type: "error", text: "Non-compliance type is required for non-compliant inspections." });
        return;
      }
      if (!violationSeverity) {
        setMessage({ type: "error", text: "Violation severity is required for non-compliant inspections." });
        return;
      }
    }

    if (!window.confirm(`Verify ${selected.complianceStatus} inspection for ${selected.businessName}?`)) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const response = await fetch(`/api/department-head/inspection-verification/${selected.inspectionId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        remarks,
        nonComplianceType: isNonCompliant ? nonComplianceType : undefined,
        violationSeverity: isNonCompliant ? violationSeverity : undefined,
      }),
    });

    const data = (await response.json()) as {
      result?: { inspectionStatus: string; applicationStatus: string };
      error?: string;
    };

    if (!response.ok) {
      setMessage({ type: "error", text: data.error ?? "Verification failed." });
      setSubmitting(false);
      return;
    }

    setMessage({
      type: "success",
      text:
        selected.complianceStatus === "COMPLIANT"
          ? "COMPLIANT inspection verified. It is now ready for compliant processing."
          : "NON_COMPLIANT inspection verified. It is now routed to Flagged Cases.",
    });
    setRemarks("");
    setNonComplianceType("");
    setViolationSeverity("");
    setSubmitting(false);
    await loadQueue();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard title="Inspection Verification Queue" description="Only DH_VERIFICATION_PENDING inspections are listed here.">
        {loading ? (
          <div className="text-sm text-slate-500">Loading verification queue...</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No inspections awaiting verification" description="JIT inspections will appear here after submission." />
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
                    active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{row.tradeName ? `${row.businessName} / ${row.tradeName}` : row.businessName}</p>
                  <p className="mt-1 text-xs text-slate-600">Result: {row.complianceStatus}</p>
                  <p className="mt-1 text-xs text-slate-600">Inspector: {row.inspectorName}</p>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Inspection Review"
        description={selected ? `${selected.applicationNumber} • ${selected.businessName}` : "Select an inspection to verify."}
      >
        {!selected ? (
          <EmptyState title="No selected inspection" description="Choose one inspection from the queue." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Business Name / Trade Name</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.tradeName ? `${selected.businessName} / ${selected.tradeName}` : selected.businessName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Permit No.</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.permitOrCertificateNumber ?? "N/A"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Business Type</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.businessType}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Line of Business</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.lineOfBusiness}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Owner / Applicant Name</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.ownerName} / {selected.applicantName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Business Address</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.businessAddress}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">JIT Result</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.complianceStatus}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Inspection Date</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(selected.inspectionDate)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Inspector</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.inspectorName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">JIT Comment / Remarks</p>
                <p className="mt-1 text-sm text-slate-900">{selected.inspectorComment ?? "No comment provided."}</p>
              </div>
            </div>

            <SectionCard title="Uploaded Evidence / Photo" description="Evidence attached to the JIT inspection.">
              {!selected.hasEvidence ? (
                <div className="text-sm text-slate-600">No evidence uploaded.</div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">{selected.evidenceFileName ?? "Evidence file"}</p>
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
              <label className="block text-sm font-medium text-slate-700" htmlFor="verification-remarks">
                Verification Remarks
              </label>
              <textarea
                id="verification-remarks"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                rows={3}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                placeholder="Enter verification remarks"
              />
            </div>

            {isNonCompliant && (
              <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-slate-700">Non-Compliance Classification</p>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="non-compliance-type">
                    Non-Compliance Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="non-compliance-type"
                    value={nonComplianceType}
                    onChange={(event) => {
                      setNonComplianceType(event.target.value);
                      setViolationSeverity("");
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Select a type --</option>
                    {NON_COMPLIANCE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {nonComplianceType && (
                    <p className="text-xs text-slate-600 italic">{HELPER_TEXT[nonComplianceType as keyof typeof HELPER_TEXT]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="violation-severity">
                    Violation Severity <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="violation-severity"
                    value={violationSeverity}
                    onChange={(event) => setViolationSeverity(event.target.value)}
                    disabled={!nonComplianceType}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">-- Select severity --</option>
                    {VIOLATION_SEVERITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleVerify()}
                disabled={submitting}
                className={actionButtonStyles("primary", "sm")}
              >
                {submitting ? "Verifying..." : "Verify Inspection"}
              </button>
            </div>

            {message ? (
              <InfoBanner
                title={message.type === "success" ? "Verification completed" : "Verification blocked"}
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
