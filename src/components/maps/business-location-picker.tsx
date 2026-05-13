"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { EB_MAGALONA_CENTER, isWithinEbMagalona } from "@/lib/business-location";

const LeafletBusinessMap = dynamic(
  () =>
    import("@/components/maps/leaflet-business-map").then(
      (mod) => mod.LeafletBusinessMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[340px] items-center justify-center rounded-[30px] border border-slate-200 bg-slate-50 text-sm text-slate-600">
        Loading map...
      </div>
    ),
  }
);

type LocationValue = {
  latitude: number;
  longitude: number;
};

export interface BusinessLocationPickerProps {
  value?: LocationValue | null;
  onChange: (value: LocationValue | null) => void;
  readOnly?: boolean;
  error?: string;
  onAddressResolved?: (address: string, coordinates: LocationValue) => void;
  onAddressResolveStart?: () => void;
  onAddressResolveError?: (message: string) => void;
}

export function BusinessLocationPicker({
  value = null,
  onChange,
  readOnly = false,
  error,
  onAddressResolved,
  onAddressResolveStart,
  onAddressResolveError,
}: BusinessLocationPickerProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const selectedPosition = useMemo<[number, number] | null>(() => {
    if (!value) return null;
    return [value.latitude, value.longitude];
  }, [value]);

  useEffect(() => {
    setValidationError(null);
  }, [readOnly, value?.latitude, value?.longitude]);

  async function handleSelectPosition(next: LocationValue) {
    if (readOnly) return;

    if (!isWithinEbMagalona(next.latitude, next.longitude)) {
      setValidationError("Selected point must stay within EB Magalona.");
      return;
    }

    setValidationError(null);
    onChange(next);

    if (onAddressResolved || onAddressResolveStart || onAddressResolveError) {
      onAddressResolveStart?.();
      setIsGeocoding(true);
      setGeocodeError(null);
      try {
        const response = await fetch(
          `/api/address/reverse-geocode?lat=${next.latitude}&lng=${next.longitude}`
        );

        if (!response.ok) {
          const message = "Address could not be auto-filled. Please enter it manually.";
          setGeocodeError(message);
          onAddressResolveError?.(message);
          return;
        }

        const data = (await response.json()) as { address: string };
        onAddressResolved?.(data.address, next);
        setGeocodeError(null);
      } catch (err) {
        console.error("[BusinessLocationPicker] Reverse geocoding error:", err);
        const message = "Address could not be auto-filled. Please enter it manually.";
        setGeocodeError(message);
        onAddressResolveError?.(message);
      } finally {
        setIsGeocoding(false);
      }
    }
  }

  const displayError = error ?? validationError;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
        <LeafletBusinessMap
          center={[EB_MAGALONA_CENTER.latitude, EB_MAGALONA_CENTER.longitude]}
          zoom={13}
          markers={[]}
          selectedPosition={selectedPosition}
          onSelectPosition={readOnly ? undefined : handleSelectPosition}
          selectedLabel="Selected Business Location"
          className="h-[340px] w-full overflow-hidden rounded-[24px] border border-slate-200 sm:h-[420px] lg:h-[520px]"
          useEbMagalonaBounds
          markerVariant="emoji"
        />
      </div>

      <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Pin the actual business location within EB Magalona.</p>
        <p className="text-sm text-slate-600">
          Selected Business Location:{" "}
          {value ? `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}` : "Not selected"}
        </p>
        {isGeocoding && (
          <p className="text-sm font-medium text-blue-700">Finding address…</p>
        )}
        {displayError ? <p className="text-sm font-medium text-red-700">{displayError}</p> : null}
        {geocodeError && !isGeocoding ? (
          <p className="text-sm font-medium text-amber-700">{geocodeError}</p>
        ) : null}
      </div>
    </div>
  );
}
