"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { EB_MAGALONA_BOUNDS, EB_MAGALONA_CENTER } from "@/lib/business-location";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { MapLegendCard } from "@/components/ui/map-legend-card";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/role-badge";
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

type LocationStatus = "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "NEEDS_CORRECTION";

interface ReleasedBusinessRow {
  businessRecordId: string;
  businessName: string;
  registrationNumber: string;
  applicationNumber: string;
  applicationType: "NEW" | "RENEWAL" | "CLOSURE";
  permitOrCertificateNumber: string | null;
  canEditLocation: boolean;
  location: {
    id: string;
    latitude: number;
    longitude: number;
    address: string | null;
    barangay: string | null;
    status: "PENDING" | "VERIFIED" | "NEEDS_CORRECTION";
    remarks: string | null;
    updatedAt: string;
  } | null;
}

const APPLICANT_MAP_LEGEND_GROUPS = [
  {
    id: "location-status",
    title: "Location Status",
    items: [
      { id: "not-submitted", label: "Not Submitted", color: "#94a3b8", note: "No saved map point yet." },
      { id: "pending", label: "Pending", color: "#2563eb", note: "Awaiting BPLO review." },
      { id: "verified", label: "Verified", color: "#15803d", note: "Locked until returned for correction." },
      {
        id: "needs-correction",
        label: "Needs Correction",
        color: "#b45309",
        note: "Review BPLO remarks before resubmitting.",
      },
      { id: "selected-pin", label: "Selected Pin", color: "#dc2626", note: "Current applicant-selected point." },
    ],
  },
];

export default function BusinessLocationPage() {
  const [records, setRecords] = useState<ReleasedBusinessRow[]>([]);
  const [selectedBusinessRecordId, setSelectedBusinessRecordId] = useState<string | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [barangay, setBarangay] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedRecord = useMemo(
    () => records.find((row) => row.businessRecordId === selectedBusinessRecordId) ?? null,
    [records, selectedBusinessRecordId]
  );

  const locationStatus: LocationStatus = useMemo(() => {
    if (!selectedRecord?.location) return "NOT_SUBMITTED";
    return selectedRecord.location.status;
  }, [selectedRecord]);

  const isCoordsOutOfBounds = useMemo(() => {
    if (!selectedCoords) return false;
    return (
      selectedCoords.latitude < EB_MAGALONA_BOUNDS.southWest.latitude ||
      selectedCoords.latitude > EB_MAGALONA_BOUNDS.northEast.latitude ||
      selectedCoords.longitude < EB_MAGALONA_BOUNDS.southWest.longitude ||
      selectedCoords.longitude > EB_MAGALONA_BOUNDS.northEast.longitude
    );
  }, [selectedCoords]);

  function statusLabel(status: LocationStatus): string {
    if (status === "PENDING") return "Pending Verification";
    if (status === "VERIFIED") return "Verified";
    if (status === "NEEDS_CORRECTION") return "Needs Correction";
    return "Not Submitted";
  }

  function statusTone(status: LocationStatus): string {
    if (status === "VERIFIED") return "border-green-200 bg-green-50 text-green-700";
    if (status === "NEEDS_CORRECTION") return "border-amber-200 bg-amber-50 text-amber-800";
    if (status === "PENDING") return "border-blue-200 bg-blue-50 text-blue-700";
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  async function loadBusinesses() {
    setIsLoading(true);
    setError(null);
    const response = await fetch("/api/applicant/business-location", { cache: "no-store" });
    const data = (await response.json()) as { records?: ReleasedBusinessRow[]; error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to load released business records");
      setIsLoading(false);
      return;
    }

    const rows = data.records ?? [];
    setRecords(rows);

    const preferredId = selectedBusinessRecordId ?? rows[0]?.businessRecordId ?? null;
    setSelectedBusinessRecordId(preferredId);

    const preferred = rows.find((row) => row.businessRecordId === preferredId) ?? null;
    if (preferred?.location) {
      setSelectedCoords({
        latitude: preferred.location.latitude,
        longitude: preferred.location.longitude,
      });
      setBarangay(preferred.location.barangay ?? "");
      setAddress(preferred.location.address ?? "");
    } else {
      setSelectedCoords(null);
      setBarangay("");
      setAddress("");
    }

    setIsLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      await loadBusinesses();
      if (!active) return;
    }

    void initialize();
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedBusinessRecordId) return;

    const nextRecord = records.find((row) => row.businessRecordId === selectedBusinessRecordId) ?? null;
    if (!nextRecord) return;

    if (nextRecord.location) {
      setSelectedCoords({
        latitude: nextRecord.location.latitude,
        longitude: nextRecord.location.longitude,
      });
      setBarangay(nextRecord.location.barangay ?? "");
      setAddress(nextRecord.location.address ?? "");
      return;
    }

    setSelectedCoords(null);
    setBarangay("");
    setAddress("");
  }, [records, selectedBusinessRecordId]);

  async function saveLocation() {
    if (!selectedRecord || !selectedCoords) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const response = await fetch(
      `/api/applicant/business-location/${selectedRecord.businessRecordId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: selectedCoords.latitude,
          longitude: selectedCoords.longitude,
          barangay,
          address,
        }),
      }
    );

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to save business location");
      setIsSaving(false);
      return;
    }

    setSuccess("Business location submitted successfully.");
    await loadBusinesses();
    setIsSaving(false);
  }

  const mapMarkers = records
    .filter((row) => row.location)
    .map((row) => ({
      id: row.businessRecordId,
      latitude: row.location?.latitude as number,
      longitude: row.location?.longitude as number,
      title: row.businessName,
      subtitle: `${row.applicationNumber} • ${row.registrationNumber}`,
      applicationType: row.applicationType,
      permitOrCertificateNumber: row.permitOrCertificateNumber,
      address: row.location?.address,
      barangay: row.location?.barangay,
      status: row.location?.status,
    }));

  const locationSummary = useMemo(
    () =>
      records.reduce(
        (accumulator, record) => {
          const status: LocationStatus = record.location ? record.location.status : "NOT_SUBMITTED";
          accumulator.total += 1;
          if (record.canEditLocation) accumulator.editable += 1;
          if (status === "VERIFIED") accumulator.verified += 1;
          if (status === "NEEDS_CORRECTION") accumulator.needsCorrection += 1;
          if (status === "PENDING") accumulator.pending += 1;
          if (status === "NOT_SUBMITTED") accumulator.notSubmitted += 1;
          return accumulator;
        },
        {
          total: 0,
          editable: 0,
          verified: 0,
          needsCorrection: 0,
          pending: 0,
          notSubmitted: 0,
        }
      ),
    [records]
  );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Applicant"
        title="Business Location"
        description="Submit and monitor Business Location coordinates for your released businesses only."
        badge={<RoleBadge role="APPLICANT" />}
      />

      <InfoBanner
        title="Released businesses only"
        description="Only your released business records appear here. Click the map to place a pin, review coordinate preview, then save using the existing submission flow."
        variant="info"
      />

      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          <div className="h-[520px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          title="No released businesses available"
          description="Only your businesses connected to RELEASED applications appear here."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <SectionCard
            title="Released Businesses"
            description="Select a released business, then submit or update Business Location coordinates."
            action={
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {records.length} total
              </span>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Location Records
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {locationSummary.total}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Released businesses currently available for applicant mapping.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Status Mix
                  </p>
                  <div className="mt-2 space-y-1.5 text-sm text-slate-600">
                    <p>Not Submitted: <span className="font-semibold text-slate-900">{locationSummary.notSubmitted}</span></p>
                    <p>Pending: <span className="font-semibold text-slate-900">{locationSummary.pending}</span></p>
                    <p>Verified: <span className="font-semibold text-slate-900">{locationSummary.verified}</span></p>
                    <p>Needs Correction: <span className="font-semibold text-slate-900">{locationSummary.needsCorrection}</span></p>
                    <p>Editable: <span className="font-semibold text-slate-900">{locationSummary.editable}</span></p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Applicant access rule</p>
                <p className="mt-1 leading-6">
                  This list includes only your released businesses. Existing ownership and released-business access rules remain unchanged.
                </p>
              </div>

              {records.map((record) => {
                const currentStatus: LocationStatus = record.location
                  ? record.location.status
                  : "NOT_SUBMITTED";

                return (
                  <button
                    key={record.businessRecordId}
                    type="button"
                    onClick={() => setSelectedBusinessRecordId(record.businessRecordId)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selectedBusinessRecordId === record.businessRecordId
                        ? "border-green-300 bg-green-50 shadow-sm shadow-green-100"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <p className="text-sm font-semibold text-slate-900">{record.businessName}</p>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {record.applicationNumber}
                        </p>
                        <p className="text-xs text-slate-600">
                          {record.applicationType} • {record.permitOrCertificateNumber ?? "No permit number"}
                        </p>
                      </div>
                      {selectedBusinessRecordId === record.businessRecordId ? (
                        <span className="rounded-full border border-green-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-green-700">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(currentStatus)}`}
                      >
                        {statusLabel(currentStatus)}
                      </span>
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {record.canEditLocation ? "Editable" : "Locked"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title={selectedRecord?.businessName ?? "Select a business"}
            description={
              selectedRecord
                ? `${selectedRecord.applicationNumber} • ${selectedRecord.registrationNumber}`
                : "Select a released business to continue"
            }
            action={
              selectedRecord ? (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(
                    locationStatus
                  )}`}
                >
                  {statusLabel(locationStatus)}
                </span>
              ) : null
            }
          >
            {!selectedRecord ? (
              <EmptyState
                title="No business selected"
                description="Select a released business from the left panel to submit location."
              />
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <InfoBanner
                      title={selectedRecord.canEditLocation ? "Click to place or update the map pin" : "Verified location is read-only"}
                      description={
                        selectedRecord.canEditLocation
                          ? "Click within the EB Magalona map area to set the exact business point. The existing save behavior and server-side coordinate validation remain unchanged."
                          : "This location is currently locked because BPLO has verified it. It becomes editable again only if BPLO returns it for correction."
                      }
                      variant={selectedRecord.canEditLocation ? "info" : "readOnly"}
                    />

                    <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">EB Magalona Map Workspace</p>
                          <p className="mt-1 text-xs text-slate-500">
                            OpenStreetMap remains focused on EB Magalona. Existing saved coordinates continue to work.
                          </p>
                        </div>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                          Click-to-Pin Enabled
                        </span>
                      </div>

                      <div className="mt-3">
                        <LeafletBusinessMap
                          center={[EB_MAGALONA_CENTER.latitude, EB_MAGALONA_CENTER.longitude]}
                          zoom={13}
                          markers={mapMarkers}
                          selectedPosition={
                            selectedCoords
                              ? [selectedCoords.latitude, selectedCoords.longitude]
                              : null
                          }
                          onSelectPosition={
                            selectedRecord.canEditLocation
                              ? ({ latitude, longitude }) => setSelectedCoords({ latitude, longitude })
                              : undefined
                          }
                          selectedLabel={selectedRecord.businessName}
                          className="h-[380px] w-full overflow-hidden rounded-[26px] sm:h-[470px] xl:h-[560px]"
                        />
                      </div>
                    </div>
                    <p className="text-xs leading-5 text-slate-500">
                      OpenStreetMap remains focused on EB Magalona only. Saved coordinates stay visible, and click-to-pin remains available only when the selected location is editable.
                    </p>
                    {isCoordsOutOfBounds ? (
                      <InfoBanner
                        title="Selected point appears outside EB Magalona"
                        description="Please review the marker placement before saving. The existing server-side validation still applies to submitted coordinates."
                        variant="warning"
                      />
                    ) : null}
                  </div>

                  <div className="space-y-4 self-start">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">Selected Business</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">{selectedRecord.businessName}</p>
                        <p>{selectedRecord.applicationNumber}</p>
                        <p>{selectedRecord.registrationNumber}</p>
                        <p>
                          {selectedRecord.applicationType} •{" "}
                          {selectedRecord.permitOrCertificateNumber ?? "No permit or certificate number"}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Latitude
                        </p>
                        <p className="mt-2 font-mono text-lg font-semibold text-slate-900">
                          {selectedCoords ? selectedCoords.latitude.toFixed(6) : "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Live preview from the current selected pin.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Longitude
                        </p>
                        <p className="mt-2 font-mono text-lg font-semibold text-slate-900">
                          {selectedCoords ? selectedCoords.longitude.toFixed(6) : "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Saved and preview values use six decimal places.</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">Submission Status</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(
                            locationStatus
                          )}`}
                        >
                          {statusLabel(locationStatus)}
                        </span>
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          {selectedRecord.canEditLocation ? "Save enabled when pin exists" : "Waiting for BPLO action"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {selectedRecord.canEditLocation
                          ? "You can place a pin and submit Business Location details for this record."
                          : "BPLO has already verified this location, so the current values remain view-only."}
                      </p>
                    </div>

                    <MapLegendCard
                      title="Map Legend"
                      subtitle="Legend stays outside the map so pins and popups remain unobstructed."
                      groups={APPLICANT_MAP_LEGEND_GROUPS}
                      footer="EB Magalona business map only."
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Latitude</span>
                    <input
                      type="text"
                      readOnly
                      value={selectedCoords ? selectedCoords.latitude.toFixed(6) : "-"}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Longitude</span>
                    <input
                      type="text"
                      readOnly
                      value={selectedCoords ? selectedCoords.longitude.toFixed(6) : "-"}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Barangay</span>
                    <input
                      type="text"
                      value={barangay}
                      onChange={(event) => setBarangay(event.target.value)}
                      disabled={!selectedRecord.canEditLocation}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 disabled:bg-slate-100"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Address / Landmark</span>
                    <input
                      type="text"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      disabled={!selectedRecord.canEditLocation}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-700 disabled:bg-slate-100"
                    />
                  </label>
                </div>

                {selectedRecord.location?.remarks ? (
                  <InfoBanner
                    title="BPLO Remarks"
                    description={selectedRecord.location.remarks}
                    variant="warning"
                  />
                ) : null}

                {error ? <InfoBanner title="Unable to save location" description={error} variant="danger" /> : null}
                {success ? <InfoBanner title="Location saved" description={success} variant="success" /> : null}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">Location submission</p>
                    <p className="text-sm text-slate-600">
                      {selectedRecord.canEditLocation
                        ? "Save keeps the existing applicant submission flow unchanged."
                        : "This record stays read-only until BPLO returns it for correction."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={saveLocation}
                    disabled={!selectedRecord.canEditLocation || !selectedCoords || isSaving}
                    className="inline-flex items-center rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:border disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-600"
                  >
                    {isSaving ? "Saving..." : "Save Location"}
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </section>
  );
}
