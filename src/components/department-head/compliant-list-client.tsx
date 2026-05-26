"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";
import { actionButtonStyles } from "@/components/ui/action-button";

type CompliantListRow = {
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
  jitComment: string | null;
  inspectionDate: string;
  verifiedAt: string;
  verifiedBy: string;
  evidenceFileName: string | null;
  evidenceMimeType: string | null;
  hasEvidence: boolean;
  inspectionStatus: string;
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function CompliantListClient() {
  const [rows, setRows] = useState<CompliantListRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const selected = useMemo(() => rows.find((row) => row.inspectionId === selectedId) ?? null, [rows, selectedId]);

  async function loadRows() {
    setLoading(true);
    const response = await fetch("/api/department-head/compliant-list", { cache: "no-store" });
    const data = (await response.json()) as { rows?: CompliantListRow[]; error?: string };

    if (!response.ok) {
      setMessage(data.error ?? "Unable to load compliant list.");
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
    void loadRows();
  }, []);

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <SectionCard title="Compliant Inspections" description="Only VERIFIED_COMPLIANT inspections are listed here.">
        {loading ? (
          <div className="text-sm text-slate-500">Loading compliant list...</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No compliant inspections yet" description="Verified compliant inspections will appear here after Department Head verification." />
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
                  <p className="mt-1 text-xs text-slate-600">Status: {row.inspectionStatus}</p>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Compliant Details" description={selected ? `${selected.applicationNumber} • ${selected.businessName}` : "Select a compliant inspection."}>
        {message ? (
          <InfoBanner title="Load issue" description={message} variant="danger" />
        ) : null}

        {!selected ? (
          <EmptyState title="No selected inspection" description="Choose one inspection from the list." />
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
                <p className="text-xs uppercase tracking-wide text-slate-500">JIT Comment / Remarks</p>
                <p className="mt-1 text-sm text-slate-900">{selected.jitComment ?? "No comment provided."}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Date Inspected</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(selected.inspectionDate)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Date Verified</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(selected.verifiedAt)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Verified By</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selected.verifiedBy}</p>
              </div>
            </div>

            <SectionCard title="Uploaded Evidence / Photo" description="Read-only evidence attached to the compliant inspection.">
              {!selected.hasEvidence ? (
                <div className="text-sm text-slate-600">No evidence file attached.</div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">{selected.evidenceFileName ?? "Evidence file"}</p>
                  {selected.evidenceMimeType?.startsWith("image/") ? (
                    <img
                      src={`/api/department-head/inspection-verification/${selected.inspectionId}/evidence`}
                      alt="Compliant inspection evidence"
                      className="max-h-72 w-full rounded-xl border border-slate-200 object-contain"
                    />
                  ) : null}
                  <a
                    href={`/api/department-head/inspection-verification/${selected.inspectionId}/evidence`}
                    target="_blank"
                    rel="noreferrer"
                    className={actionButtonStyles("secondary", "sm")}
                  >
                    Open Evidence File
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>
              )}
            </SectionCard>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Status: <span className="font-semibold">VERIFIED_COMPLIANT</span>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}