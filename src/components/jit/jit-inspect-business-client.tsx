"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, Search, ShieldCheck } from "lucide-react";
import { actionButtonStyles } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { InfoBanner } from "@/components/ui/info-banner";
import { SectionCard } from "@/components/ui/section-card";
import { DashboardSummaryCard } from "@/components/applicant/dashboard-summary-card";
import type { MapBusinessCategory } from "@/lib/business-map-categories";

interface InspectableBusinessRow {
  locationId: string;
  businessRecordId: string;
  applicationId: string;
  applicantName: string;
  tradeName: string | null;
  businessName: string;
  businessType: string | null;
  ownerName: string;
  businessCategory: MapBusinessCategory;
  businessCategoryLabel: string;
  businessCategoryColor: string;
  applicationNumber: string;
  applicationType: "NEW" | "RENEWAL";
  submittedAt: string | null;
  permitOrCertificateNumber: string | null;
  permitValidUntil: string | null;
  lineOfBusiness: string | null;
  applicationStatus: string;
  bploRemarks: string | null;
  documents: Array<{
    id: string;
    documentName: string;
    fileName: string;
    uploadedAt: string;
  }>;
  latitude: number;
  longitude: number;
  address: string | null;
  barangay: string | null;
  status: "PENDING" | "VERIFIED" | "NEEDS_CORRECTION";
  remarks: string | null;
  updatedAt: string;
  latestInspection: {
    complianceStatus: "COMPLIANT" | "NON_COMPLIANT";
    status:
      | "COMPLIANT"
      | "NON_COMPLIANT"
      | "DH_VERIFICATION_PENDING"
      | "VERIFIED_COMPLIANT"
      | "VERIFIED_NON_COMPLIANT"
      | "REVOCATION_REVIEW"
      | "REVOCATION_DENIED"
      | "REVOKED";
    createdAt: string;
  } | null;
}

type ComplianceStatus = "COMPLIANT" | "NON_COMPLIANT";

function formatDateTime(value: string | null): string {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function JitInspectBusinessClient() {
  const [rows, setRows] = useState<InspectableBusinessRow[]>([]);
  const [selectedBusinessRecordId, setSelectedBusinessRecordId] = useState<string | null>(null);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>("COMPLIANT");
  const [comment, setComment] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const filteredRows = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !search ||
        row.businessName.toLowerCase().includes(search) ||
        (row.tradeName ?? "").toLowerCase().includes(search) ||
        row.ownerName.toLowerCase().includes(search) ||
        row.applicantName.toLowerCase().includes(search) ||
        (row.permitOrCertificateNumber ?? "").toLowerCase().includes(search);

      return matchesSearch;
    });
  }, [rows, searchText]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.businessRecordId === selectedBusinessRecordId) ?? null,
    [rows, selectedBusinessRecordId]
  );

  const summaryCounts = useMemo(() => {
    const inspectionSummary = rows.length;
    const flaggedBusinessesCount = rows.filter((row) => {
      const latestStatus = row.latestInspection?.status;
      return latestStatus === "NON_COMPLIANT" || latestStatus === "REVOCATION_REVIEW" || latestStatus === "REVOKED";
    }).length;
    const compliantCount = rows.filter((row) => row.latestInspection?.status === "COMPLIANT").length;
    const nonCompliantCount = rows.filter((row) => {
      const latestStatus = row.latestInspection?.status;
      return latestStatus === "NON_COMPLIANT" || latestStatus === "REVOCATION_REVIEW";
    }).length;

    return {
      inspectionSummary,
      flaggedBusinessesCount,
      compliantCount,
      nonCompliantCount,
    };
  }, [rows]);

  async function loadRows() {
    setIsLoading(true);
    const response = await fetch("/api/jit/inspect-a-business", { cache: "no-store" });
    const data = (await response.json()) as { rows?: InspectableBusinessRow[]; error?: string };

    if (!response.ok) {
      setStatusMessage({ kind: "error", text: data.error ?? "Unable to load inspectable businesses" });
      setRows([]);
      setIsLoading(false);
      return;
    }

    const nextRows = data.rows ?? [];
    setRows(nextRows);

    const nextSelected = nextRows.find((row) => row.businessRecordId === selectedBusinessRecordId);
    if (nextSelected) {
      setSelectedBusinessRecordId(nextSelected.businessRecordId);
    } else if (nextRows[0]) {
      setSelectedBusinessRecordId(nextRows[0].businessRecordId);
    } else {
      setSelectedBusinessRecordId(null);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadRows();
  }, []);

  useEffect(() => {
    if (filteredRows.length === 0) {
      return;
    }

    if (!filteredRows.some((row) => row.businessRecordId === selectedBusinessRecordId)) {
      setSelectedBusinessRecordId(filteredRows[0].businessRecordId);
    }
  }, [filteredRows, selectedBusinessRecordId]);

  function validateForm(): string | null {
    if (!selectedRow) {
      return "Select a business first.";
    }

    if (!comment.trim()) {
      return "Comment is required for all inspections.";
    }
    if (!evidenceFile) {
      return "Photo evidence is required for all inspections.";
    }

    return null;
  }

  async function handleSubmit() {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!selectedRow) return;

    setIsSubmitting(true);
    setFormError(null);
    setStatusMessage(null);

    const payload = new FormData();
    payload.set("complianceStatus", complianceStatus);
    payload.set("comment", comment);
    if (evidenceFile) {
      payload.set("evidencePhoto", evidenceFile);
    }

    const response = await fetch(`/api/jit/inspect-a-business/${selectedRow.businessRecordId}`, {
      method: "POST",
      body: payload,
    });

    const data = (await response.json()) as {
      inspection?: { status: string };
      error?: string;
    };

    if (!response.ok) {
      setFormError(data.error ?? "Unable to submit inspection.");
      setIsSubmitting(false);
      return;
    }

    setComplianceStatus("COMPLIANT");
    setComment("");
    setEvidenceFile(null);
    setStatusMessage({
      kind: "success",
      text: "Inspection submitted for Department Head verification.",
    });

    await loadRows();
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      {statusMessage ? (
        <InfoBanner
          title={statusMessage.kind === "success" ? "Inspection update" : "Inspection issue"}
          description={statusMessage.text}
          variant={statusMessage.kind === "success" ? "success" : "danger"}
        />
      ) : null}

      <SectionCard
        title="Inspectable Released Businesses"
        description="Only active released businesses are listed. Search by business name, owner, or permit number."
        action={
          <Link href="/jit/dashboard" className={actionButtonStyles("secondary", "sm")}>
            Back to Dashboard
          </Link>
        }
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <FormField label="Search" htmlFor="jit-inspection-search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="jit-inspection-search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Business, trade name, owner/applicant, permit number"
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardSummaryCard title="Inspection Summary" value={summaryCounts.inspectionSummary.toString()} subtitle="All visible inspection records" tone="slate" icon={<FileText className="h-4 w-4" />} />
            <DashboardSummaryCard title="Flagged Count" value={summaryCounts.flaggedBusinessesCount.toString()} subtitle="Latest non-compliant/review/revoked" tone="red" icon={<ShieldCheck className="h-4 w-4" />} />
            <DashboardSummaryCard title="Compliant Count" value={summaryCounts.compliantCount.toString()} subtitle="Latest compliant inspection" tone="green" icon={<ShieldCheck className="h-4 w-4" />} />
            <DashboardSummaryCard title="Non-Compliant Count" value={summaryCounts.nonCompliantCount.toString()} subtitle="Non-compliant and revocation review records" tone="amber" icon={<ChevronRight className="h-4 w-4" />} />
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {filteredRows.length > 0 ? (
            filteredRows.map((row) => {
              const isSelected = selectedRow?.businessRecordId === row.businessRecordId;

              return (
                <article
                  key={row.businessRecordId}
                  className={`rounded-3xl border p-4 shadow-sm transition ${
                    isSelected ? "border-emerald-300 bg-emerald-50/70" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Trade Name / Business Name</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{row.tradeName ? `${row.tradeName} / ${row.businessName}` : row.businessName}</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Permit No.</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{row.permitOrCertificateNumber ?? "Not available"}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Business Type</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessType ?? "Not available"}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Line of Business</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{row.lineOfBusiness ?? "Not available"}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2 xl:col-span-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Owner / Applicant</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{row.ownerName} / {row.applicantName}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2 xl:col-span-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Business Address</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{row.address ?? "Not available"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      <button
                        type="button"
                        onClick={() => setSelectedBusinessRecordId(row.businessRecordId)}
                        className={actionButtonStyles(isSelected ? "readOnly" : "primary", "sm")}
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="No businesses match the search"
              description="Try a different search term."
            />
          )}
        </div>
      </SectionCard>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No released businesses available"
          description="Inspection queue will populate once permits are released with active business records."
        />
      ) : filteredRows.length === 0 ? (
        <EmptyState title="No businesses match the search" description="Try a different search term." />
      ) : (
        <SectionCard
          title="Inspection Panel"
          description="JIT may log COMPLIANT or NON_COMPLIANT findings. JIT cannot revoke directly."
        >
          {selectedRow ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Application Number</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.applicationNumber}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Application Type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.applicationType}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Current Status</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.applicationStatus}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Applicant / Owner Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.applicantName} / {selectedRow.ownerName}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Business Name / Trade Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.tradeName ? `${selectedRow.businessName} / ${selectedRow.tradeName}` : selectedRow.businessName}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Business Type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.businessType ?? "Not available"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Line of Business</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.lineOfBusiness ?? "Not available"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 xl:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Business Address</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.address ?? "Not available"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Submitted Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(selectedRow.submittedAt)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Permit Number</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.permitOrCertificateNumber ?? "Not available"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 xl:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Business Location / Coordinates</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Lat {selectedRow.latitude.toFixed(6)}, Lng {selectedRow.longitude.toFixed(6)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 xl:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">BPLO Remarks</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selectedRow.bploRemarks ?? "None"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2 xl:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Uploaded Application Documents</p>
                  {selectedRow.documents.length > 0 ? (
                    <ul className="mt-1 space-y-1 text-sm font-semibold text-slate-900">
                      {selectedRow.documents.map((doc) => (
                        <li key={doc.id}>{doc.documentName} - {doc.fileName} ({formatDateTime(doc.uploadedAt)})</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-slate-900">No uploaded documents found.</p>
                  )}
                </div>
              </div>

              <InfoBanner
                title="Inspection outcome"
                description="Both COMPLIANT and NON_COMPLIANT require a comment and photo evidence. Submission routes to Department Head Inspection Verification."
                variant="warning"
              />

              <FormField label="Compliance Status" required error={formError?.includes("complianceStatus") ? formError : undefined}>
                <select
                  value={complianceStatus}
                  onChange={(event) => setComplianceStatus(event.target.value as ComplianceStatus)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="COMPLIANT">COMPLIANT</option>
                  <option value="NON_COMPLIANT">NON_COMPLIANT</option>
                </select>
              </FormField>

              <FormField
                label="Comment / Remarks"
                required
                error={formError?.includes("Comment") ? formError : undefined}
                hint="Required for both COMPLIANT and NON_COMPLIANT."
              >
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-3 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </FormField>

              <FormField
                label="Photo Evidence"
                required
                error={formError?.includes("Photo evidence") ? formError : undefined}
                hint="Accepted types follow existing document upload rules (JPG, PNG, WEBP, PDF)."
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </FormField>

              {formError && !formError.includes("complianceStatus") && !formError.includes("Comment") && !formError.includes("Photo evidence") ? (
                <p className="text-sm font-medium text-rose-700">{formError}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleSubmit();
                  }}
                  disabled={isSubmitting}
                  className={actionButtonStyles("primary", "md")}
                >
                  {isSubmitting ? "Submitting..." : "Submit Inspection"}
                </button>
                {selectedRow ? (
                  <Link href="/jit/business-map" className={actionButtonStyles("secondary", "md")}>
                    View Business Map
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyState title="Select a business" description="Pick one business card to start inspection." />
          )}
        </SectionCard>
      )}
    </div>
  );
}
