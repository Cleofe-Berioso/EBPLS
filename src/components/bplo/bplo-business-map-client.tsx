"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { EB_MAGALONA_CENTER } from "@/lib/eb-magalona";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { InfoBanner } from "@/components/ui/info-banner";
import { MapLegendCard } from "@/components/ui/map-legend-card";
import { SectionCard } from "@/components/ui/section-card";
import {
  MAP_CATEGORY_META,
  type MapBusinessCategory,
} from "@/lib/business-map-categories";

const LeafletBusinessMap = dynamic(
  () =>
    import("@/components/maps/leaflet-business-map").then(
      (mod) => mod.LeafletBusinessMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[440px] w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
    ),
  }
);

type ApplicationTypeFilter = "ALL" | "NEW" | "RENEWAL";

interface BploBusinessLocationRow {
  locationId: string;
  businessRecordId: string;
  businessName: string;
  ownerName: string;
  businessCategory: MapBusinessCategory;
  businessCategoryLabel: string;
  businessCategoryColor: string;
  applicationNumber: string;
  applicationType: "NEW" | "RENEWAL";
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

export function BploBusinessMapClient() {
  const [rows, setRows] = useState<BploBusinessLocationRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<ApplicationTypeFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<
    "ALL" | MapBusinessCategory
  >("ALL");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  async function loadRows() {
    setIsLoading(true);
    setError(null);

    const response = await fetch(`/api/bplo/business-map`, {
      cache: "no-store",
    });

    const data = (await response.json()) as {
      rows?: BploBusinessLocationRow[];
      error?: string;
    };

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
  }, []);

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
        if (typeFilter !== "ALL" && row.applicationType !== typeFilter) {
          return false;
        }

        if (
          categoryFilter !== "ALL" &&
          row.businessCategory !== categoryFilter
        ) {
          return false;
        }

        if (ownerFilter.trim()) {
          const owner = ownerFilter.trim().toLowerCase();

          if (!row.ownerName.toLowerCase().includes(owner)) {
            return false;
          }
        }

        if (searchFilter.trim()) {
          const search = searchFilter.trim().toLowerCase();

          if (!row.businessName.toLowerCase().includes(search)) {
            return false;
          }
        }

        return true;
      }),
    [categoryFilter, ownerFilter, rows, searchFilter, typeFilter]
  );

  const markers = useMemo(
    () =>
      visibleRows.map((row) => ({
        id: row.locationId,
        latitude: row.latitude,
        longitude: row.longitude,
        title: row.businessName,
        subtitle: `${row.applicationNumber} • ${
          row.permitOrCertificateNumber ?? "No document number"
        }`,
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
    [visibleRows]
  );

  const summary = useMemo(() => {
    return visibleRows.reduce(
      (accumulator, row) => {
        accumulator.total += 1;

        if (row.status === "PENDING") {
          accumulator.pending += 1;
        }

        if (row.status === "VERIFIED") {
          accumulator.verified += 1;
        }

        if (row.status === "NEEDS_CORRECTION") {
          accumulator.needsCorrection += 1;
        }

        if (row.applicationType === "NEW") {
          accumulator.newCount += 1;
        }

        if (row.applicationType === "RENEWAL") {
          accumulator.renewalCount += 1;
        }

        return accumulator;
      },
      {
        total: 0,
        pending: 0,
        verified: 0,
        needsCorrection: 0,
        newCount: 0,
        renewalCount: 0,
      }
    );
  }, [visibleRows]);

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
                    <p className="text-sm font-semibold text-slate-900">
                      EB Magalona Review Map
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      OpenStreetMap tiles and saved business coordinates remain
                      unchanged.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMapKey((prev) => prev + 1)}
                      className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Re-center to EB Magalona
                    </button>

                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                      BPLO Review View
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <LeafletBusinessMap
                    key={mapKey}
                    center={[
                      EB_MAGALONA_CENTER.latitude,
                      EB_MAGALONA_CENTER.longitude,
                    ]}
                    zoom={13}
                    markers={markers}
                    className="h-[380px] w-full overflow-hidden rounded-[26px] sm:h-[460px] xl:h-[580px]"
                  />
                </div>
              </div>
            )}

            <p className="text-xs leading-5 text-slate-500">
              Map focus remains within EB Magalona. Marker clicks open business
              details, and verify/return actions use the same behavior.
            </p>

            <MapLegendCard
              title="Map Legend"
              subtitle="Legend and filter controls stay outside the map so they never cover pins or popups."
              groups={BPLO_MAP_LEGEND_GROUPS}
              footer="EB Magalona business map only."
            />

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
            description="Filter New or Renewal records, then narrow by business category and ownership details."
            contentClassName="grid gap-3"
          >
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">
                Application Type
              </span>
              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value as ApplicationTypeFilter)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700"
              >
                <option value="ALL">All</option>
                <option value="NEW">New</option>
                <option value="RENEWAL">Renewal</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">
                Business Category
              </span>
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as "ALL" | MapBusinessCategory
                  )
                }
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
              <span className="font-medium text-slate-700">
                Owner / Operator
              </span>
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
              <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">
                Active Filters
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700">
                  Type: {typeFilter === "ALL" ? "All" : typeFilter}
                </span>
                <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-700">
                  Category:{" "}
                  {categoryFilter === "ALL"
                    ? "All"
                    : MAP_CATEGORY_META[categoryFilter].label}
                </span>
              </div>
            </div>
          </FilterBar>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Location Summary
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {summary.total}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Records matched by the current BPLO filters.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Queue Split
              </p>
              <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                <p>
                  New:{" "}
                  <span className="font-semibold text-slate-900">
                    {summary.newCount}
                  </span>
                </p>
                <p>
                  Renewal:{" "}
                  <span className="font-semibold text-slate-900">
                    {summary.renewalCount}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2 xl:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Application Types
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                  New {summary.newCount}
                </span>
                <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                  Renewal {summary.renewalCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}