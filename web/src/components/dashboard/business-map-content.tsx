"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import {
  EB_MAGALONA,
  EB_MAGALONA_LEAFLET_BOUNDS,
  isWithinEbMagalona,
  type GeoMapLocationRecord,
} from "@/lib/locations";
import "leaflet/dist/leaflet.css";

interface BusinessMapContentProps {
  locations: GeoMapLocationRecord[];
}

function escapeHtml(value?: string | null): string {
  return (value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function BusinessMapContent({ locations }: BusinessMapContentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const boundaryRef = useRef<L.Rectangle | null>(null);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) {
      return;
    }

    const bounds = L.latLngBounds(EB_MAGALONA_LEAFLET_BOUNDS);
    const mapInstance = L.map(mapRef.current, {
      zoomControl: true,
      maxBounds: bounds.pad(0.1),
      maxBoundsViscosity: 0.8,
    }).setView([EB_MAGALONA.center.lat, EB_MAGALONA.center.lon], EB_MAGALONA.zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    boundaryRef.current = L.rectangle(bounds, {
      color: "#2563EB",
      weight: 1,
      fillOpacity: 0.03,
    }).addTo(mapInstance);

    mapInstanceRef.current = mapInstance;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      boundaryRef.current?.remove();
      boundaryRef.current = null;
      mapInstance.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      return;
    }

    const mapInstance = mapInstanceRef.current;
    const visibleLocations = locations.filter((location) =>
      isWithinEbMagalona(location.latitude, location.longitude)
    );

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    visibleLocations.forEach((location) => {
      const popupContent = `
        <div style="min-width: 210px; font-size: 12px; line-height: 1.5;">
          <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700;">
            ${escapeHtml(location.label || location.application?.businessName || "Business")}
          </p>
          <p style="margin: 0 0 4px 0; color: #475569;">
            <strong>Type:</strong> ${escapeHtml(location.application?.businessType || location.businessType || "N/A")}
          </p>
          <p style="margin: 0 0 4px 0; color: #475569;">
            <strong>Status:</strong> ${escapeHtml(location.statusLabel)}
          </p>
          <p style="margin: 0 0 4px 0; color: #475569;">
            <strong>Address:</strong> ${escapeHtml(location.application?.businessAddress || "N/A")}
          </p>
          <p style="margin: 0 0 4px 0; color: #475569;">
            <strong>Application #:</strong> ${escapeHtml(location.application?.applicationNumber || "N/A")}
          </p>
        </div>
      `;

      const marker = L.marker([location.latitude, location.longitude], {
        icon: L.divIcon({
          html: `<div style="background-color:${location.pinColor};width:18px;height:18px;border-radius:9999px;border:3px solid #ffffff;box-shadow:0 3px 10px rgba(15,23,42,0.28);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -10],
          className: "leaflet-custom-marker",
        }),
      });

      marker.bindPopup(popupContent);
      marker.addTo(mapInstance);
      markersRef.current.push(marker);
    });

    if (visibleLocations.length > 0) {
      const markerBounds = L.latLngBounds(
        visibleLocations.map((location) => [location.latitude, location.longitude] as [number, number])
      );
      mapInstance.fitBounds(markerBounds.pad(0.2), { maxZoom: 16 });
    } else {
      mapInstance.setView([EB_MAGALONA.center.lat, EB_MAGALONA.center.lon], EB_MAGALONA.zoom);
    }
  }, [locations]);

  return <div ref={mapRef} className="h-full w-full" />;
}
