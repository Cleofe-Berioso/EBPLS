"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { EB_MAGALONA_CENTER } from "@/lib/business-location";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { InfoBanner } from "@/components/ui/info-banner";
import { MapLegendCard } from "@/components/ui/map-legend-card";
import { SectionCard } from "@/components/ui/section-card";
import { MAP_CATEGORY_META, type MapBusinessCategory } from "@/lib/business-map-categories";

const LeafletBusinessMap = dynamic(
  () => import("@/components/maps/leaflet-business-map").then((mod) => mod.LeafletBusinessMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[440px] w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
    ),
  }
);

type ApplicationTypeFilter = "ALL" | "NEW" | "RENEWAL" | "CLOSURE";
type LocationStatusFilter = "ALL" | "PENDING" | "VERIFIED" | "NEEDS_CORRECTION";

interface BploBusinessLocationRow {
  locationId: string;
  businessRecordId: string;
  businessName: string;
  ownerName: string;
  businessCategory: MapBusinessCategory;
  businessCategoryLabel: string;
  businessCategoryColor: string;
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

const BPLO_MAP_LEGEND_GROUPS = [
  {
    id: "business-category",
    title: "Business Category",
    items: Object.entries(MAP_CATEGORY_META).map(([key, meta]) => ({
      id: key.toLowerCase(),
      label: meta.label,
      color: meta.color,
      note: `Map marker color for ${meta.label} businesses.`,
    })),
  },
];

function statusClass(status: BploBusinessLocationRow["status"]): string {
  if (status === "VERIFIED") return "border-green-200 bg-green-50 text-green-700";
  if (status === "NEEDS_CORRECTION") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function typeClass(type: BploBusinessLocationRow["applicationType"]): string {
  if (type === "RENEWAL") return "border-violet-200 bg-violet-50 text-violet-700";
  if (type === "CLOSURE") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-teal-200 bg-teal-50 text-teal-700";
}

export function BploBusinessMapClient() {
  const [rows, setRows] = useState<BploBusinessLocationRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<ApplicationTypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<LocationStatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | MapBusinessCategory>("ALL");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [returnRemarksById, setReturnRemarksById] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRows() {
    setIsLoading(true);
    setError(null);

    const response = await fetch(
      `/api/bplo/business-map?type=${encodeURIComponent(typeFilter)}&status=${encodeURIComponent(statusFilter)}&category=${encodeURIComponent(categoryFilter)}&owner=${encodeURIComponent(ownerFilter)}&search=${encodeURIComponent(searchFilter)}`,
      { cache: "no-store" }
    );

    const data = (await response.json()) as { rows?: BploBusinessLocationRow[]; error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to load business map records");
      setIsLoading(false);
      return;
    }

    setRows(data.rows ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    void loadRows();
  }, [typeFilter, statusFilter, categoryFilter, ownerFilter, searchFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const markers = useMemo(
    () =>
      rows.map((row) => ({
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
        ownerName: row.ownerName,
        businessCategory: row.businessCategory,
        businessCategoryLabel: row.businessCategoryLabel,
        businessCategoryColor: row.businessCategoryColor,
      })),
    [rows]
  );

  const summary = useMemo(() => {
    return rows.reduce(
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
  }, [rows]);

  async function verifyLocation(row: BploBusinessLocationRow) {
    setIsSaving(true);
    const response = await fetch(`/api/bplo/business-map/${row.locationId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Unable to verify location");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    await loadRows();
  }

  async function returnForCorrection(row: BploBusinessLocationRow) {
    const remarks = (returnRemarksById[row.locationId] ?? "").trim();
    if (!remarks) {
      setError("Remarks are required when returning location for correction");
      return;
    }

    setIsSaving(true);
    const response = await fetch(`/api/bplo/business-map/${row.locationId}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks }),
    });

    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error ?? "Unable to return location for correction");
      setIsSaving(false);
      return;
    }

    setReturnRemarksById((prev) => ({ ...prev, [row.locationId]: "" }));
    setIsSaving(false);
    await loadRows();
  }

  return (
    <div className="space-y-5">
      {error ? (
        <InfoBanner
          title="Business map action could not be completed"
          description={error}
          variant="danger"
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SectionCard
          title="Business Location Map"
          description="Map is centered on Enrique B. Magalona and shows submitted business pins using OpenStreetMap tiles."
        >
          <div className="space-y-3">
            {isLoading ? (
              <div className="h-[360px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100 sm:h-[440px] xl:h-[560px]" />
            ) : (
              <div className="rounded-[30px] border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">EB Magalona Review Map</p>
                    <p className="mt-1 text-xs text-slate-500">
                      OpenStreetMap tiles and saved business coordinates remain unchanged.
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    BPLO Review View
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
            )}

            <p className="text-xs leading-5 text-slate-500">
              Map focus remains within EB Magalona. Marker clicks open business details, and verify/return actions use the same behavior.
            </p>

            {!isLoading && rows.length === 0 ? (
              <EmptyState
                title="No submitted locations"
                description="Submitted applicant locations will appear here after released applications are mapped."
              />
            ) : null}
          </div>
        </SectionCard>

        <div className="space-y-4 self-start">
          <FilterBar
            title="Map Filters"
            description="Filter New, Renewal, or Closure records, then narrow by current Business Location status."
            contentClassName="grid gap-3"
          >
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Application Type</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as ApplicationTypeFilter)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700"
              >
                <option value="ALL">All</option>
                <option value="NEW">New</option>
                <option value="RENEWAL">Renewal</option>
                <option value="CLOSURE">Closure</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Location Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as LocationStatusFilter)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700"
              >
                <option value="ALL">All</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="NEEDS_CORRECTION">Needs Correction</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Business Category</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as "ALL" | MapBusinessCategory)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700"
              >
                <option value="ALL">All</option>
                {Object.entries(MAP_CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Owner / Operator</span>
              <input
                value={ownerFilter}
                onChange={(event) => setOwnerFilter(event.target.value)}
                placeholder="Search by owner name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Business Name</span>
              <input
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
                placeholder="Search by business name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700"
              />
            </label>
          </FilterBar>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Location Summary</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{summary.total}</p>
              <p className="mt-1 text-sm text-slate-600">Records matched by the current BPLO filters.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Queue Split</p>
              <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                <p>Pending: <span className="font-semibold text-slate-900">{summary.pending}</span></p>
                <p>Verified: <span className="font-semibold text-slate-900">{summary.verified}</span></p>
                <p>Needs Correction: <span className="font-semibold text-slate-900">{summary.needsCorrection}</span></p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2 xl:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Application Types</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                  New {summary.newCount}
                </span>
                <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                  Renewal {summary.renewalCount}
                </span>
                <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  Closure {summary.closureCount}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">Review Focus</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the map for quick geographic review, then confirm or return the submitted location from the queue below. Existing verify and return behavior remains unchanged.
            </p>
          </div>

          <InfoBanner
            title="Verification actions stay unchanged"
            description="Use Verify Location to confirm a submitted pin, or Return for Correction with remarks to send it back to the applicant. Existing API routes and BPLO rules remain unchanged."
            variant="info"
          />

          <MapLegendCard
            title="Map Legend"
            subtitle="Legend and filter controls stay outside the map so they never cover pins or popups."
            groups={BPLO_MAP_LEGEND_GROUPS}
            footer="EB Magalona business map only."
          />
        </div>
      </div>

      <SectionCard
        title={`Location Submissions (${rows.length})`}
        description="Review submitted Business Location records, then verify or return for correction with remarks."
      >
        {rows.length === 0 ? (
          <EmptyState
            title="No records available yet"
            description="Location submissions that match your selected filters will appear here."
          />
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div
                key={row.locationId}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5 text-sm text-slate-700">
                        <p className="text-base font-semibold tracking-tight text-slate-900">{row.businessName}</p>
                        <p className="text-xs text-slate-600">Owner: {row.ownerName}</p>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          {row.applicationNumber}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${typeClass(row.applicationType)}`}>
                            {row.applicationType}
                          </span>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(row.status)}`}>
                            {row.status}
                          </span>
                          <span
                            className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                            style={{ borderColor: row.businessCategoryColor, color: row.businessCategoryColor }}
                          >
                            {row.businessCategoryLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/70 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Coordinates</p>
                        <p className="mt-2 font-mono text-sm font-semibold text-slate-900">
                          {row.latitude.toFixed(6)}, {row.longitude.toFixed(6)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Current applicant-submitted location pin.</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Permit / Certificate</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {row.permitOrCertificateNumber ?? "No number recorded"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Released-business reference for this map record.</p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm text-slate-600">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Address</p>
                        <p className="mt-2 font-medium text-slate-900">{row.address ?? "No address provided"}</p>
                        <p className="mt-1 text-xs text-slate-500">Barangay: {row.barangay ?? "Not specified"}</p>
                      </div>
                      <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 text-sm text-slate-600">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Latest BPLO Remarks</p>
                        <p className="mt-2 font-medium text-slate-900">{row.remarks ?? "No remarks recorded"}</p>
                        <p className="mt-1 text-xs text-slate-500">Updated at {new Date(row.updatedAt).toLocaleString("en-PH")}</p>
                      </div>
                    </div>
                  </div>

                    <div className="space-y-3 rounded-2xl border border-white/80 bg-white px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">Action Panel</p>
                        <p className="text-sm leading-6 text-slate-600">
                          Apply the next BPLO review action using the existing verify and return endpoints.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Current State</p>
                      <p className="mt-2 font-semibold text-slate-900">{row.status}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Verify to accept the location, or return it for correction with remarks.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        placeholder="Remarks for correction"
                        value={returnRemarksById[row.locationId] ?? ""}
                        onChange={(event) =>
                          setReturnRemarksById((prev) => ({
                            ...prev,
                            [row.locationId]: event.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                      />
                      <p className="text-xs leading-5 text-slate-500">
                        Remarks are required only when returning a location for correction.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isSaving || row.status === "VERIFIED"}
                          onClick={() => void verifyLocation(row)}
                          className="rounded-xl bg-green-700 px-3.5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-600"
                        >
                          Verify Location
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void returnForCorrection(row)}
                          className="rounded-xl bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-600"
                        >
                          Return for Correction
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
