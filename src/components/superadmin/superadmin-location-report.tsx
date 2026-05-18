"use client";

import dynamic from "next/dynamic";
import { EB_MAGALONA_CENTER } from "@/lib/eb-magalona";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { MapLegendCard } from "@/components/ui/map-legend-card";
import { SectionCard } from "@/components/ui/section-card";

const LeafletBusinessMap = dynamic(
  () => import("@/components/maps/leaflet-business-map").then((mod) => mod.LeafletBusinessMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
    ),
  }
);

interface SuperAdminLocationRow {
  locationId: string;
  businessRecordId: string;
  businessName: string;
  applicationNumber: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  permitOrCertificateNumber: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  barangay: string | null;
  status: "PENDING" | "VERIFIED" | "NEEDS_CORRECTION";
  remarks: string | null;
  updatedAt: string;
}

const SUPER_ADMIN_MAP_LEGEND_GROUPS = [
  {
    id: "location-status",
    title: "Location Status",
    items: [
      { id: "pending", label: "Pending", color: "#2563eb", note: "Submitted and awaiting BPLO review." },
      { id: "verified", label: "Verified", color: "#15803d", note: "Accepted business location." },
      {
        id: "needs-correction",
        label: "Needs Correction",
        color: "#b45309",
        note: "Returned to the applicant with remarks.",
      },
    ],
  },
  {
    id: "application-type",
    title: "Application Type",
    items: [
      { id: "new", label: "New", color: "#0f766e", note: "Initial business registration record." },
      { id: "renewal", label: "Renewal", color: "#7c3aed", note: "Renewed business record." },
      { id: "closure", label: "Closure", color: "#475569", note: "Closure-related record." },
    ],
  },
];

function statusClass(status: SuperAdminLocationRow["status"]): string {
  if (status === "VERIFIED") return "border-green-200 bg-green-50 text-green-700";
  if (status === "NEEDS_CORRECTION") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

export function SuperAdminLocationReport({ rows }: { rows: SuperAdminLocationRow[] }) {
  const markers = rows.map((row) => ({
    id: row.locationId,
    latitude: row.latitude,
    longitude: row.longitude,
    title: row.businessName,
    subtitle: `${row.applicationNumber} • ${row.permitOrCertificateNumber ?? "No document number"}`,
    applicationType: row.applicationType,
    permitOrCertificateNumber: row.permitOrCertificateNumber,
    address: row.address,
    barangay: row.barangay,
    status: row.status,
  }));

  const summary = rows.reduce(
    (accumulator, row) => {
      accumulator.total += 1;

      if (row.status === "PENDING") accumulator.pending += 1;
      if (row.status === "VERIFIED") accumulator.verified += 1;
      if (row.status === "NEEDS_CORRECTION") accumulator.needsCorrection += 1;

      if (row.applicationType === "NEW") accumulator.newCount += 1;
      if (row.applicationType === "RENEWAL") accumulator.renewalCount += 1;
      if (row.applicationType === "CLOSURE") accumulator.closureCount += 1;

      return accumulator;
    },
    {
      total: 0,
      pending: 0,
      verified: 0,
      needsCorrection: 0,
      newCount: 0,
      renewalCount: 0,
      closureCount: 0,
    }
  );

  return (
    <SectionCard
      title="Business Location Report"
      description="Read-only map and Business Location records for released-business submissions."
      action={
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {rows.length} records
        </span>
      }
    >
      <div className="space-y-5">
        {rows.length === 0 ? (
          <EmptyState
            title="No location records yet"
            description="This report populates after applicants submit business locations."
          />
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total Locations</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{summary.total}</p>
                <p className="mt-1 text-sm text-slate-600">All read-only map records currently stored.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status Mix</p>
                <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                  <p>Pending: <span className="font-semibold text-slate-900">{summary.pending}</span></p>
                  <p>Verified: <span className="font-semibold text-slate-900">{summary.verified}</span></p>
                  <p>Needs Correction: <span className="font-semibold text-slate-900">{summary.needsCorrection}</span></p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Application Types</p>
                <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                  <p>New: <span className="font-semibold text-slate-900">{summary.newCount}</span></p>
                  <p>Renewal: <span className="font-semibold text-slate-900">{summary.renewalCount}</span></p>
                  <p>Closure: <span className="font-semibold text-slate-900">{summary.closureCount}</span></p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Viewing Mode</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Read-only report</p>
                <p className="mt-1 text-sm text-slate-600">No verify, edit, or return controls are available here.</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-3">
                <div className="rounded-[30px] border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">EB Magalona Oversight Map</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Read-only OpenStreetMap workspace for stored business location submissions.
                      </p>
                    </div>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      View Only
                    </span>
                  </div>

                  <div className="mt-3">
                    <LeafletBusinessMap
                      center={[EB_MAGALONA_CENTER.latitude, EB_MAGALONA_CENTER.longitude]}
                      zoom={13}
                      markers={markers}
                      className="h-[380px] w-full overflow-hidden rounded-[26px] sm:h-[460px] xl:h-[580px]"
                    />
                  </div>
                </div>
                <p className="text-xs leading-5 text-slate-500">
                  This map stays limited to EB Magalona and is displayed strictly for reporting and audit review.
                </p>
              </div>

              <div className="space-y-4 self-start">
                <InfoBanner
                  title="Read-only location monitoring"
                  description="Super Admin can inspect map points, statuses, and summary counts here, but cannot verify, edit, or return any Business Location record."
                  variant="readOnly"
                />

                <MapLegendCard
                  title="Map Legend"
                  subtitle="Legend remains outside the map so reports stay readable on desktop and mobile."
                  groups={SUPER_ADMIN_MAP_LEGEND_GROUPS}
                  footer="EB Magalona business map only."
                />
              </div>
            </div>

            <div className="space-y-4">
              {rows.map((row) => (
                <div
                  key={row.locationId}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="space-y-4 text-sm text-slate-700">
                      <div className="space-y-1.5">
                        <p className="text-base font-semibold tracking-tight text-slate-900">{row.businessName}</p>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          {row.applicationNumber} • {row.applicationType}
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/80 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Coordinates</p>
                          <p className="mt-2 font-mono text-sm font-semibold text-slate-900">
                            {row.latitude.toFixed(6)}, {row.longitude.toFixed(6)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">Saved map point from the applicant submission.</p>
                        </div>
                        <div className="rounded-2xl border border-white/80 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Permit / Certificate</p>
                          <p className="mt-2 font-semibold text-slate-900">{row.permitOrCertificateNumber ?? "No number recorded"}</p>
                          <p className="mt-1 text-xs text-slate-500">Barangay: {row.barangay ?? "Not specified"}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/80 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Address and Remarks</p>
                        <p className="mt-2 font-medium text-slate-900">{row.address ?? "No address provided"}</p>
                        <p className="mt-2 text-xs text-slate-500">Remarks: {row.remarks ?? "No remarks recorded"}</p>
                        <p className="mt-1 text-xs text-slate-500">Updated at {new Date(row.updatedAt).toLocaleString("en-PH")}</p>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-white/80 bg-white px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">Record Status</p>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                      <p className="text-sm leading-6 text-slate-600">
                        View-only monitoring of the current Business Location status.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}
