"use client";

import { useEffect, useMemo, useState } from "react";
import { actionButtonStyles } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";

type RevokedPermitRow = {
  inspectionId: string;
  businessRecordId: string;
  applicationId: string;
  applicationNumber: string;
  permitOrCertificateNumber: string | null;
  businessName: string;
  ownerName: string;
  applicantName: string;
  businessAddress: string;
  lineOfBusiness: string;
  jitInspectionDate: string;
  jitInspectorName: string;
  jitComment: string | null;
  revocationRemarks: string | null;
  revocationDecisionDate: string;
  decidedByName: string;
  evidenceFileName: string | null;
  evidenceMimeType: string | null;
  hasEvidence: boolean;
  inspectionStatus: string;
  applicationStatus: string;
  businessStatus: string;
};

function formatDateTime(value: string): string {
  if (!value || value === "-") return "-";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function RevokePermitListClient() {
  const [rows, setRows] = useState<RevokedPermitRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "error"; text: string } | null>(null);

  const selected = useMemo(
    () => rows.find((row) => row.inspectionId === selectedId) ?? null,
    [rows, selectedId]
  );

  useEffect(() => {
    async function loadRows() {
      setLoading(true);
      const response = await fetch("/api/department-head/revoke-permit-list", { cache: "no-store" });
      const data = (await response.json()) as { rows?: RevokedPermitRow[]; error?: string };

      if (!response.ok) {
        setMessage({ type: "error", text: data.error ?? "Unable to load revoked permit list." });
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

    void loadRows();
  }, []);

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard
        title="Restricted Businesses"
        description="Read-only list of businesses with approved revocations and active restrictions."
      >
        {loading ? (
          <div className="text-sm text-slate-500">Loading restricted businesses...</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            No restricted businesses found.
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
                      ? "border-rose-300 bg-rose-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                  <p className="mt-1 text-xs text-slate-600">Decision: {formatDateTime(row.revocationDecisionDate)}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-rose-700">{row.inspectionStatus}</p>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Restriction Details"
        description={selected ? `${selected.applicationNumber} • ${selected.businessName}` : "Select a restricted business."}
      >
        {!selected ? (
          <EmptyState title="No selected record" description="Choose a restricted business from the list." />
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
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.applicationNumber}</p>
                <p className="text-xs text-slate-600">Permit: {selected.permitOrCertificateNumber ?? "N/A"}</p>
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
                <p className="mt-1 text-sm text-slate-900">{formatDateTime(selected.jitInspectionDate)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">JIT Inspector</p>
                <p className="mt-1 text-sm text-slate-900">{selected.jitInspectorName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">JIT Comment</p>
                <p className="mt-1 text-sm text-slate-900">{selected.jitComment ?? "No comment provided."}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Department Head Revocation Remarks</p>
                <p className="mt-1 text-sm text-slate-900">{selected.revocationRemarks ?? "No remarks recorded."}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Revocation Decision Date</p>
                <p className="mt-1 text-sm text-slate-900">{formatDateTime(selected.revocationDecisionDate)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Decided By</p>
                <p className="mt-1 text-sm text-slate-900">{selected.decidedByName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Current Status</p>
                <p className="mt-1 text-sm text-slate-900">Application: {selected.applicationStatus}</p>
                <p className="text-xs text-slate-600">Business: {selected.businessStatus}</p>
              </div>
            </div>

            <SectionCard title="Evidence" description="Read-only evidence attached during JIT inspection.">
              {!selected.hasEvidence ? (
                <div className="text-sm text-slate-600">No evidence file attached.</div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-700">{selected.evidenceFileName ?? "Evidence"}</p>
                  {selected.evidenceMimeType?.startsWith("image/") ? (
                    <img
                      src={`/api/department-head/permit-to-revoke/${selected.inspectionId}/evidence`}
                      alt="Revoked permit inspection evidence"
                      className="max-h-72 w-full rounded-xl border border-slate-200 object-contain"
                    />
                  ) : null}
                  <a
                    href={`/api/department-head/permit-to-revoke/${selected.inspectionId}/evidence`}
                    target="_blank"
                    rel="noreferrer"
                    className={actionButtonStyles("secondary", "sm")}
                  >
                    Open Evidence File
                  </a>
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {message ? (
          <div className="mt-4">
            <InfoBanner title="Load failed" description={message.text} variant="danger" />
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
