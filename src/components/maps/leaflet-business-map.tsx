"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { EB_MAGALONA_BOUNDS } from "@/lib/eb-magalona";

export interface LeafletBusinessMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  status?: string;
  ownerName?: string;
  businessCategory?: string;
  businessCategoryLabel?: string;
  businessCategoryColor?: string;
  applicationType?: string;
  permitOrCertificateNumber?: string | null;
  address?: string | null;
  barangay?: string | null;
  mapMarkerColor?: string;
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
  markerVariant?: "default" | "emoji";
}



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

function MapRecenter({ 
  selectedPosition, 
  shouldAlwaysCenter 
}: { 
  selectedPosition?: [number, number] | null;
  shouldAlwaysCenter?: boolean;
}) {
  const map = useMap();
  const hasCenteredOnSelection = useRef(false);

  useEffect(() => {
    if (!selectedPosition) return;
    
    // Only center automatically on first selection if shouldAlwaysCenter is true
    // Otherwise, let the user control panning freely
    if (shouldAlwaysCenter) {
      map.setView(selectedPosition, map.getZoom());
    } else if (!hasCenteredOnSelection.current) {
      map.setView(selectedPosition, map.getZoom());
      hasCenteredOnSelection.current = true;
    }
  }, [map, selectedPosition, shouldAlwaysCenter]);

  return null;
}

function markerColor(marker: LeafletBusinessMarker): string {
  // Use mapMarkerColor if available (e.g., JIT inspection status color)
  // Otherwise fall back to businessCategoryColor
  return marker.mapMarkerColor ?? marker.businessCategoryColor ?? "#64748b";
}

function typeTone(applicationType?: string): string {
  if (applicationType === "RENEWAL") return "border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--foreground)]";
  return "border-[var(--border-color)] bg-[var(--info-soft)] text-[var(--info)]";
}

function typeLabel(applicationType?: string): string | null {
  if (!applicationType) return null;
  if (applicationType === "NEW") return "New";
  if (applicationType === "RENEWAL") return "Renewal";
  return applicationType;
}

export function LeafletBusinessMap({
  center,
  zoom = 13,
  markers,
  selectedPosition,
  onSelectPosition,
  selectedLabel = "Selected business location",
  className = "h-[clamp(320px,55vh,520px)] w-full overflow-hidden rounded-2xl border border-slate-200/90 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]",
  useEbMagalonaBounds = false,
  markerVariant = "default",
}: LeafletBusinessMapProps) {
  const maxBounds: [[number, number], [number, number]] | undefined = useEbMagalonaBounds
    ? [
        [EB_MAGALONA_BOUNDS.southWest.latitude, EB_MAGALONA_BOUNDS.southWest.longitude],
        [EB_MAGALONA_BOUNDS.northEast.latitude, EB_MAGALONA_BOUNDS.northEast.longitude],
      ]
    : undefined;

  return (
    <div className={`leaflet-map-shell ${className}`}>
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom={false}
      maxBounds={maxBounds}
      maxBoundsViscosity={useEbMagalonaBounds ? 0.85 : 0}
      minZoom={useEbMagalonaBounds ? 11 : 1}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onSelectPosition={onSelectPosition} />
      <MapRecenter selectedPosition={selectedPosition} shouldAlwaysCenter={useEbMagalonaBounds} />

      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.latitude, marker.longitude]}
          radius={9}
          pathOptions={{
            color: markerColor(marker),
            fillColor: markerColor(marker),
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
                <span className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--muted-surface)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
                  Saved Pin
                </span>
                {marker.businessCategoryLabel ? (
                  <span
                    className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide"
                    style={{ borderColor: marker.businessCategoryColor, color: marker.businessCategoryColor }}
                  >
                    {marker.businessCategoryLabel}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-2">
                {(marker.permitOrCertificateNumber || marker.barangay || marker.address) ? (
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--muted-surface)] px-3 py-3 text-xs text-[var(--ink-muted)]">
                    <p className="font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
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
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--muted-surface)] px-3 py-2 text-xs text-[var(--ink-muted)]">
                  <p className="font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Coordinates</p>
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
        (() => {
          // optionally render an emoji divIcon for applicant-selected pins
          const icon =
            markerVariant === "emoji"
              ? L.divIcon({
                  html: `<div style="display:flex;align-items:center;justify-content:center;font-size:28px;line-height:1;width:40px;height:40px;background:rgba(255,255,255,0.9);border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,0.25);">📍</div>`,
                  className: "leaflet-emoji-icon",
                  iconSize: [40, 40],
                  iconAnchor: [20, 40],
                })
              : undefined;

          return (
            <Marker
              position={selectedPosition}
              icon={icon}
              draggable={Boolean(onSelectPosition)}
              eventHandlers={
                onSelectPosition
                  ? {
                      dragend(event) {
                        const next = event.target.getLatLng();
                        onSelectPosition({ latitude: next.lat, longitude: next.lng });
                      },
                    }
                  : undefined
              }
            >
          <Popup className="leaflet-business-map-popup">
            <div className="min-w-[240px] space-y-3 text-sm">
              <div className="space-y-1.5">
                <p className="text-base font-semibold tracking-tight text-slate-900">{selectedLabel}</p>
                <p className="text-sm leading-5 text-slate-600">
                  Click map or drag marker to set exact business location pin.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--danger-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--danger)]">
                  Selected Pin
                </span>
                <span className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--success)]">
                  Ready to Save
                </span>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--muted-surface)] px-3 py-2 text-xs text-[var(--ink-muted)]">
                <p className="font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Coordinates</p>
                <p className="mt-1 font-medium text-slate-700">
                  {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                </p>
              </div>
            </div>
          </Popup>
            </Marker>
          );
        })()
      ) : null}
    </MapContainer>
    </div>
  );
}
