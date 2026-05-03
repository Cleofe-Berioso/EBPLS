"use client";

import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { EB_MAGALONA_BOUNDS } from "@/lib/business-location";

export interface LeafletBusinessMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  status?: string;
  applicationType?: string;
  permitOrCertificateNumber?: string | null;
  address?: string | null;
  barangay?: string | null;
}

interface LeafletBusinessMapProps {
  center: [number, number];
  zoom?: number;
  markers: LeafletBusinessMarker[];
  selectedPosition?: [number, number] | null;
  onSelectPosition?: (coords: { latitude: number; longitude: number }) => void;
  selectedLabel?: string;
  className?: string;
  useEbMagalonaBounds?: boolean;
}

const EB_MAGALONA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [EB_MAGALONA_BOUNDS.southWest.latitude, EB_MAGALONA_BOUNDS.southWest.longitude],
  [EB_MAGALONA_BOUNDS.northEast.latitude, EB_MAGALONA_BOUNDS.northEast.longitude],
];

function MapClickHandler({
  onSelectPosition,
}: {
  onSelectPosition?: (coords: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(event) {
      if (!onSelectPosition) return;
      onSelectPosition({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function statusColor(status?: string): string {
  if (status === "VERIFIED") return "#15803d";
  if (status === "NEEDS_CORRECTION") return "#b45309";
  return "#2563eb";
}

function statusLabel(status?: string): string {
  if (!status) return "Pending";
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status?: string): string {
  if (status === "VERIFIED") return "border-green-200 bg-green-50 text-green-800";
  if (status === "NEEDS_CORRECTION") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-blue-200 bg-blue-50 text-blue-800";
}

function typeTone(applicationType?: string): string {
  if (applicationType === "RENEWAL") return "border-violet-200 bg-violet-50 text-violet-700";
  if (applicationType === "CLOSURE") return "border-slate-200 bg-slate-100 text-slate-700";
  return "border-teal-200 bg-teal-50 text-teal-700";
}

function typeLabel(applicationType?: string): string | null {
  if (!applicationType) return null;
  if (applicationType === "NEW") return "New";
  if (applicationType === "RENEWAL") return "Renewal";
  if (applicationType === "CLOSURE") return "Closure";
  return applicationType;
}

export function LeafletBusinessMap({
  center,
  zoom = 13,
  markers,
  selectedPosition,
  onSelectPosition,
  selectedLabel = "Selected business location",
  className = "h-[380px] w-full overflow-hidden rounded-[30px] border border-slate-200/90 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] sm:h-[460px] lg:h-[580px]",
  useEbMagalonaBounds = true,
}: LeafletBusinessMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      scrollWheelZoom
      maxBounds={useEbMagalonaBounds ? EB_MAGALONA_MAX_BOUNDS : undefined}
      maxBoundsViscosity={useEbMagalonaBounds ? 0.9 : undefined}
      minZoom={useEbMagalonaBounds ? 12 : undefined}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onSelectPosition={onSelectPosition} />

      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.latitude, marker.longitude]}
          radius={9}
          pathOptions={{
            color: statusColor(marker.status),
            fillColor: statusColor(marker.status),
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Popup className="leaflet-business-map-popup">
            <div className="min-w-[240px] space-y-3 text-sm">
              <div className="space-y-1.5">
                <p className="text-base font-semibold tracking-tight text-slate-900">{marker.title}</p>
                {marker.subtitle ? (
                  <p className="text-sm leading-5 text-slate-600">{marker.subtitle}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {typeLabel(marker.applicationType) ? (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${typeTone(
                      marker.applicationType
                    )}`}
                  >
                    {typeLabel(marker.applicationType)}
                  </span>
                ) : null}
                {marker.status ? (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusTone(
                      marker.status
                    )}`}
                  >
                    {statusLabel(marker.status)}
                  </span>
                ) : null}
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                  Saved Pin
                </span>
              </div>
              <div className="grid gap-2">
                {(marker.permitOrCertificateNumber || marker.barangay || marker.address) ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
                    <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Location Summary
                    </p>
                    {marker.permitOrCertificateNumber ? (
                      <p className="mt-2 text-slate-700">
                        <span className="font-medium text-slate-900">Document:</span>{" "}
                        {marker.permitOrCertificateNumber}
                      </p>
                    ) : null}
                    {marker.barangay ? (
                      <p className="mt-1 text-slate-700">
                        <span className="font-medium text-slate-900">Barangay:</span> {marker.barangay}
                      </p>
                    ) : null}
                    {marker.address ? (
                      <p className="mt-1 leading-5 text-slate-700">
                        <span className="font-medium text-slate-900">Address:</span> {marker.address}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Coordinates</p>
                  <p className="mt-1 font-medium text-slate-700">
                    {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {selectedPosition ? (
        <CircleMarker
          center={selectedPosition}
          radius={10}
          pathOptions={{
            color: "#dc2626",
            fillColor: "#dc2626",
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Popup className="leaflet-business-map-popup">
            <div className="min-w-[240px] space-y-3 text-sm">
              <div className="space-y-1.5">
                <p className="text-base font-semibold tracking-tight text-slate-900">{selectedLabel}</p>
                <p className="text-sm leading-5 text-slate-600">
                  Current applicant-selected map pin within the EB Magalona map boundary.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-800">
                  Selected Pin
                </span>
                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                  Ready to Save
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p className="font-semibold uppercase tracking-[0.18em] text-slate-500">Coordinates</p>
                <p className="mt-1 font-medium text-slate-700">
                  {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                </p>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ) : null}
    </MapContainer>
  );
}
