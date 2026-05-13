"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { actionButtonStyles } from "@/components/ui/action-button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { InfoBanner } from "@/components/ui/info-banner";
import { MapLegendCard } from "@/components/ui/map-legend-card";
import { SectionCard } from "@/components/ui/section-card";
import { EB_MAGALONA_CENTER } from "@/lib/business-location";
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

type ApplicationTypeFilter = "ALL" | "NEW" | "RENEWAL";

interface JitBusinessMapRow {
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
  permitValidUntil: string | null;
  lineOfBusiness: string | null;
  applicationStatus: string;
  latitude: number;
  longitude: number;
  address: string | null;
  barangay: string | null;
  status: "PENDING" | "VERIFIED" | "NEEDS_CORRECTION";
  remarks: string | null;
  updatedAt: string;
}

const JIT_MAP_LEGEND_GROUPS = [
  {
    id: "business-category",
    title: "Business Category",
    items: Object.entries(MAP_CATEGORY_META).map(([key, meta]) => ({
      id: key.toLowerCase(),
      label: meta.label,
      color: meta.color,
      note: `Marker color for ${meta.label}`,
    })),
  },
  {
    id: "status",
    title: "Map Pin Status",
    items: [
      { id: "pending", label: "Pending", color: "#f59e0b" },
      { id: "verified", label: "Verified", color: "#0f766e" },
      { id: "correction", label: "Needs Correction", color: "#dc2626" },
    ],
  },
];

function pinStatusTone(status: JitBusinessMapRow["status"]): string {
  if (status === "VERIFIED") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "NEEDS_CORRECTION") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function toShortDate(iso: string | null): string {
  if (!iso) return "N/A";
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "N/A";
  return value.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function JitBusinessMapClient() {
  const [rows, setRows] = useState<JitBusinessMapRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<ApplicationTypeFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | MapBusinessCategory>("ALL");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRows() {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/jit/business-map", { cache: "no-store" });
      const data = (await response.json()) as { rows?: JitBusinessMapRow[]; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to load JIT business map records");
        setIsLoading(false);
        return;
      }

      setRows(data.rows ?? []);
      setIsLoading(false);
    }

    void loadRows();
  }, []);

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
        if (typeFilter !== "ALL" && row.applicationType !== typeFilter) return false;
        if (categoryFilter !== "ALL" && row.businessCategory !== categoryFilter) return false;

        if (ownerFilter.trim()) {
          const owner = ownerFilter.trim().toLowerCase();
          if (!row.ownerName.toLowerCase().includes(owner)) return false;
        }

        if (searchFilter.trim()) {
          const search = searchFilter.trim().toLowerCase();
          if (!row.businessName.toLowerCase().includes(search)) return false;
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
        subtitle: `${row.ownerName} • ${row.permitOrCertificateNumber ?? "No permit number"}`,
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

  return (
    <div className="space-y-5">
      {error ? (
        <InfoBanner title="Unable to load JIT business map" description={error} variant="danger" />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SectionCard
          title="Active Permitted Businesses"
          description="Released businesses only. This map is read-only for JIT monitoring and planning."
        >
          {isLoading ? (
            <div className="h-[360px] animate-pulse rounded-[28px] border border-slate-200 bg-slate-100 sm:h-[440px] xl:h-[560px]" />
          ) : visibleRows.length === 0 ? (
            <EmptyState
              title="No released businesses found"
              description="Businesses appear here only after permit release with a saved location pin."
            />
          ) : (
            <LeafletBusinessMap
              center={[EB_MAGALONA_CENTER.latitude, EB_MAGALONA_CENTER.longitude]}
              zoom={13}
              markers={markers}
              className="h-[380px] w-full overflow-hidden rounded-[26px] sm:h-[460px] xl:h-[580px]"
            />
          )}
        </SectionCard>

        <div className="space-y-4 self-start">
          <FilterBar
            title="Map Filters"
            description="Filter by application type, category, owner, and business name."
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

          <MapLegendCard
            title="Map Legend"
            subtitle="Category colors are reused from BPLO map rules."
            groups={JIT_MAP_LEGEND_GROUPS}
          />
        </div>
      </div>

      <SectionCard
        title="Released Business Details"
        description="Read-only list for JIT planning. No revocation and no inspection submission in this phase."
        action={
          <Link href="/jit/inspect-a-business" className={actionButtonStyles("secondary", "sm")}>
            Go to Inspection Queue
          </Link>
        }
      >
        <div className="space-y-3">
          {visibleRows.map((row) => (
            <article key={row.locationId} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold text-slate-900">{row.businessName}</p>
                  <p className="text-sm text-slate-600">Owner: {row.ownerName}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ borderColor: row.businessCategoryColor, color: row.businessCategoryColor }}
                  >
                    {row.businessCategoryLabel}
                  </span>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${pinStatusTone(row.status)}`}>
                    {row.status.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
                <p><span className="font-semibold">Line of Business:</span> {row.lineOfBusiness ?? "N/A"}</p>
                <p><span className="font-semibold">Permit Number:</span> {row.permitOrCertificateNumber ?? "N/A"}</p>
                <p><span className="font-semibold">Permit Valid Until:</span> {toShortDate(row.permitValidUntil)}</p>
                <p><span className="font-semibold">Current Status:</span> {row.applicationStatus}</p>
                <p className="md:col-span-2 xl:col-span-2"><span className="font-semibold">Business Address:</span> {row.address ?? "N/A"}</p>
                <p><span className="font-semibold">Coordinates:</span> {row.latitude.toFixed(6)}, {row.longitude.toFixed(6)}</p>
                <p><span className="font-semibold">Application No:</span> {row.applicationNumber}</p>
              </div>
            </article>
          ))}

          {!isLoading && visibleRows.length === 0 ? (
            <EmptyState
              title="No rows matched current filters"
              description="Try resetting filters or wait for newly released permits with pinned locations."
            />
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
