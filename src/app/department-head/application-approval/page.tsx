"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
import { SectionCard } from "@/components/ui/section-card";
import { InfoBanner } from "@/components/ui/info-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { actionButtonStyles } from "@/components/ui/action-button";

type ApprovalRow = {
  id: string;
  applicationNumber: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  ownerName: string;
  businessName: string;
  businessType: string;
  lineOfBusiness: string;
  businessAddress: string;
  submittedDate: string;
  updatedDate: string;
  currentStatus: string;
  bploRemarks: string | null;
  formData: Record<string, unknown>;
  history: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    actorRole: string;
    remarks: string | null;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    documentName: string;
    fileName: string;
    uploadedAt: string;
  }>;
};

type ActionType = "approve" | "return" | "reject";

function formatDateTime(value: string): string {
  if (!value || value === "-") return "-";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function readText(formData: Record<string, unknown>, keys: string[], fallback = "-") {
  for (const key of keys) {
    const value = formData[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
}

function readFlag(formData: Record<string, unknown>, key: string) {
  const value = formData[key];
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return "-";
}

function formatBirthDate(value: string): string {
  if (!value || value === "-") return "-";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(parsed);
}

export default function DepartmentHeadApplicationApprovalPage() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId]
  );

  async function loadQueue() {
    setLoading(true);
    const response = await fetch("/api/department-head/application-approval", { cache: "no-store" });
    const data = (await response.json()) as { rows?: ApprovalRow[]; error?: string };

    if (!response.ok) {
      setMessage({ type: "error", text: data.error ?? "Unable to load Department Head review queue." });
      setRows([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }

    const nextRows = data.rows ?? [];
    setRows(nextRows);
    setSelectedId((current) => {
      if (current && nextRows.some((row) => row.id === current)) return current;
      return nextRows[0]?.id ?? null;
    });
    setLoading(false);
  }

  useEffect(() => {
    void loadQueue();
  }, []);

  async function runAction(action: ActionType) {
    if (!selected) return;

    if ((action === "return" || action === "reject") && !remarks.trim()) {
      setMessage({ type: "error", text: "Remarks are required for return and reject actions." });
      return;
    }

    setPendingAction(action);
    setMessage(null);

    const response = await fetch(
      `/api/department-head/application-approval/${selected.id}/${action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks }),
      }
    );

    const data = (await response.json()) as {
      application?: { applicationNumber: string; status: string };
      error?: string;
    };

    if (!response.ok) {
      setMessage({ type: "error", text: data.error ?? "Action failed." });
      setPendingAction(null);
      return;
    }

    setMessage({
      type: "success",
      text: `${data.application?.applicationNumber ?? "Application"} moved to ${data.application?.status ?? "new status"}.`,
    });
    setRemarks("");
    setPendingAction(null);
    await loadQueue();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Department Head"
        title="Application Approvals"
        description="Review BPLO-approved applications before they proceed to Fees & Assessment."
        badge={<RoleBadge role="VIEW_ONLY" label="Department Head" />}
      />

      <InfoBanner
        title="Scope Guardrail"
        description="This module handles approval decisions only. Fees, TOP, payment verification, permit issuance, revocation, and inspection actions are not available here."
        variant="readOnly"
      />

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard
          title="Pending Application Approvals"
          description="BPLO-approved applications waiting for Department Head decision."
        >
          {loading ? (
            <div className="text-sm text-slate-500">Loading application queue...</div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              No applications are pending approval.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => {
                const active = selectedId === row.id;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-mono text-xs text-slate-600">{row.applicationNumber}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{row.businessName}</p>
                    <p className="mt-1 text-xs text-slate-600">{row.ownerName} • {row.applicationType}</p>
                    <div className="mt-2">
                      <StatusBadge status={row.currentStatus as any} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={selected ? "Application Review Details" : "Application Review Details"}
          description={selected ? `${selected.applicationNumber} • ${selected.businessName}` : "Select an item from the queue."}
        >
          {!selected ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              No selected application.
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const formData = selected.formData ?? {};
                const ownerFirstName = readText(formData, ["ownerFirstName"], "");
                const ownerMiddleName = readText(formData, ["ownerMiddleName"], "");
                const ownerSurname = readText(formData, ["ownerSurname"], "");
                const ownerName = readText(formData, ["ownerName"], selected.ownerName);
                const latitude = typeof formData.businessLatitude === "number" ? formData.businessLatitude : null;
                const longitude = typeof formData.businessLongitude === "number" ? formData.businessLongitude : null;
                const closureReason = readText(formData, ["closureReason", "reasonForClosure", "closureRemarks"], "-");

                return (
                  <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Application Number</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selected.applicationNumber}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Application Type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selected.applicationType}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Current Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selected.currentStatus as any} />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Applicant / Owner Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selected.ownerName}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Business Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selected.businessName}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Submitted Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(selected.submittedDate)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Last Updated</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(selected.updatedDate)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Business Type</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selected.businessType}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Line of Business</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selected.lineOfBusiness}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Business Address</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{selected.businessAddress}</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title="Applicant / Owner Information" description="Filed owner identity and contact details.">
                  <div className="space-y-2 text-sm text-slate-700">
                    {ownerFirstName || ownerMiddleName || ownerSurname ? (
                      <>
                        <p><strong>First Name:</strong> {ownerFirstName || "-"}</p>
                        <p><strong>Middle Name:</strong> {ownerMiddleName || "-"}</p>
                        <p><strong>Surname:</strong> {ownerSurname || "-"}</p>
                      </>
                    ) : (
                      <p><strong>Owner / President:</strong> {ownerName}</p>
                    )}
                    <p><strong>Age:</strong> {readText(formData, ["ownerAge"])}</p>
                    <p><strong>Birthdate:</strong> {formatBirthDate(readText(formData, ["birthDate"]))}</p>
                    <p><strong>Sex:</strong> {readText(formData, ["sex"])}</p>
                    <p><strong>Nationality:</strong> {readText(formData, ["nationality"])}</p>
                    <p><strong>Email:</strong> {readText(formData, ["email"])}</p>
                    <p><strong>Phone:</strong> {readText(formData, ["phone"])}</p>
                  </div>
                </SectionCard>

                <SectionCard title="Business Identity" description="Filed registration and identity details.">
                  <div className="space-y-2 text-sm text-slate-700">
                    <p><strong>Business Name:</strong> {readText(formData, ["businessName"], selected.businessName)}</p>
                    <p><strong>Trade Name:</strong> {readText(formData, ["tradeName"])}</p>
                    <p><strong>Business Type:</strong> {readText(formData, ["businessType"], selected.businessType)}</p>
                    <p><strong>Registration Type:</strong> {readText(formData, ["businessType"], selected.businessType)}</p>
                    <p><strong>Registration Number:</strong> {readText(formData, ["registrationNumber"])}</p>
                    <p><strong>TIN:</strong> {readText(formData, ["tin"])}</p>
                    <p><strong>Business Activity:</strong> {readText(formData, ["businessActivity"])}</p>
                    <p><strong>Main / Branch:</strong> {readText(formData, ["businessOperationType"])}</p>
                    <p><strong>Line of Business:</strong> {readText(formData, ["lineOfBusiness"], selected.lineOfBusiness)}</p>
                  </div>
                </SectionCard>

                <SectionCard title="Address and Location" description="Filed addresses and map pin details.">
                  <div className="space-y-2 text-sm text-slate-700">
                    <p><strong>Main Office Address:</strong> {readText(formData, ["mainOfficeAddress"])}</p>
                    <p><strong>Business Address:</strong> {readText(formData, ["businessAddress"], selected.businessAddress)}</p>
                    <p><strong>Barangay:</strong> {readText(formData, ["barangay"])}</p>
                    <p><strong>Street:</strong> {readText(formData, ["streetAddress"])}</p>
                    <p><strong>Coordinates:</strong> {latitude != null && longitude != null ? `${latitude}, ${longitude}` : "-"}</p>
                    <p><strong>Location Verification:</strong> {latitude != null && longitude != null ? "Location pinned" : "Location not pinned"}</p>
                  </div>
                </SectionCard>

                <SectionCard title="Business Operation Details" description="Operational and property declarations.">
                  <div className="space-y-2 text-sm text-slate-700">
                    <p><strong>Business Area:</strong> {readText(formData, ["businessArea"])}</p>
                    <p><strong>Total Floor Area:</strong> {readText(formData, ["totalFloorArea"])}</p>
                    <p><strong>Asset Size:</strong> {readText(formData, ["assetSize"])}</p>
                    <p><strong>Property Ownership:</strong> {readText(formData, ["propertyOwnership"])}</p>
                    <p><strong>Tax Declaration Number:</strong> {readText(formData, ["taxDeclarationNumber"])}</p>
                    <p><strong>Property Identification Number:</strong> {readText(formData, ["propertyIdentificationNumber"])}</p>
                    <p><strong>Tax Incentives:</strong> {readText(formData, ["taxIncentives"])}</p>
                    <p><strong>Market Business:</strong> {readFlag(formData, "isMarket")}</p>
                    <p><strong>Agriculture-related:</strong> {readFlag(formData, "isAgriculture")}</p>
                    <p><strong>Liquor/Tobacco:</strong> {readFlag(formData, "isLiquorOrTobacco")}</p>
                  </div>
                </SectionCard>

                <SectionCard title="Employee Counts" description="Submitted staffing and vehicle declarations.">
                  <div className="space-y-2 text-sm text-slate-700">
                    <p><strong>Total Employees:</strong> {readText(formData, ["totalEmployees"])}</p>
                    <p><strong>Male Employees:</strong> {readText(formData, ["maleEmployees"])}</p>
                    <p><strong>Female Employees:</strong> {readText(formData, ["femaleEmployees"])}</p>
                    <p><strong>Employees within Municipality:</strong> {readText(formData, ["employeesWithinMunicipality"])}</p>
                    <p><strong>Delivery Vehicles:</strong> {readText(formData, ["deliveryVehicles"])}</p>
                  </div>
                </SectionCard>

                <SectionCard title="Application-specific Notes" description="Renewal and closure-specific declarations.">
                  <div className="space-y-2 text-sm text-slate-700">
                    <p><strong>Application Type:</strong> {selected.applicationType}</p>
                    {selected.applicationType === "CLOSURE" ? (
                      <p><strong>Closure Reason:</strong> {closureReason}</p>
                    ) : null}
                    {selected.applicationType === "RENEWAL" ? (
                      <p><strong>Renewal Payment Preference:</strong> {readText(formData, ["paymentFrequency"])}</p>
                    ) : null}
                    {selected.applicationType === "NEW" ? (
                      <p><strong>Capital Investment:</strong> {readText(formData, ["capitalInvestment"])}</p>
                    ) : null}
                    {selected.applicationType === "RENEWAL" ? (
                      <p><strong>Gross Profit:</strong> {readText(formData, ["grossProfit"])}</p>
                    ) : null}
                  </div>
                </SectionCard>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">BPLO Remarks</p>
                <p className="mt-1 text-sm text-slate-900">{selected.bploRemarks ?? "No BPLO remarks provided."}</p>
              </div>

              <SectionCard title="Uploaded Documents" description="Applicant-provided files attached to this application.">
                {selected.documents.length === 0 ? (
                  <div className="text-sm text-slate-600">No uploaded documents.</div>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {selected.documents.map((doc) => (
                      <li key={doc.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p className="font-medium text-slate-900">{doc.documentName}: {doc.fileName}</p>
                        <p className="text-xs text-slate-500">Uploaded: {formatDateTime(doc.uploadedAt)}</p>
                        <p className="text-xs text-slate-500">Status: Uploaded</p>
                        <a
                          href={`/api/department-head/application-approval/${selected.id}/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${actionButtonStyles("secondary", "sm")} mt-2 inline-flex`}
                        >
                          Preview
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title="Timeline / Remarks" description="Status transitions and recorded remarks.">
                {selected.history.length === 0 ? (
                  <div className="text-sm text-slate-600">No timeline entries yet.</div>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-700">
                    {selected.history.map((item) => (
                      <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="font-medium text-slate-900">
                          {item.fromStatus ? `${item.fromStatus} to ` : ""}
                          {item.toStatus}
                        </p>
                        <p className="text-xs text-slate-600">Actor: {item.actorRole}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                        <p className="mt-1 text-sm text-slate-700">{item.remarks ?? "No remarks provided."}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700" htmlFor="approval-remarks">
                  Remarks (required for Return and Reject)
                </label>
                <textarea
                  id="approval-remarks"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                  rows={3}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Required for Return for Correction and Reject actions"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runAction("approve")}
                  disabled={pendingAction !== null}
                  className={actionButtonStyles("primary", "sm")}
                >
                  {pendingAction === "approve" ? "Processing..." : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("return")}
                  disabled={pendingAction !== null}
                  className={actionButtonStyles("warning", "sm")}
                >
                  {pendingAction === "return" ? "Processing..." : "Return for Correction"}
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("reject")}
                  disabled={pendingAction !== null}
                  className={actionButtonStyles("danger", "sm")}
                >
                  {pendingAction === "reject" ? "Processing..." : "Reject"}
                </button>
              </div>

              {message ? (
                <InfoBanner
                  title={message.type === "success" ? "Action completed" : "Action blocked"}
                  description={message.text}
                  variant={message.type === "success" ? "success" : "danger"}
                />
              ) : null}
                  </>
                );
              })()}
            </div>
          )}
        </SectionCard>
      </div>
    </section>
  );
}