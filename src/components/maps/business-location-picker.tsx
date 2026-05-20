"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { EB_MAGALONA_CENTER, isWithinEbMagalona } from "@/lib/eb-magalona";

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
}

export function BusinessLocationPicker({
  value = null,
  onChange,
  readOnly = false,
  error,
}: BusinessLocationPickerProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedPosition = useMemo<[number, number] | null>(() => {
    if (!value) return null;
    return [value.latitude, value.longitude];
  }, [value]);

  useEffect(() => {
    setValidationError(null);
  }, [readOnly, value?.latitude, value?.longitude]);

  function handleSelectPosition(next: LocationValue) {
    if (readOnly) return;

    const latitude = Number(next.latitude);
    const longitude = Number(next.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setValidationError("Selected point is invalid. Please choose another location.");
      return;
    }

    if (!isWithinEbMagalona(latitude, longitude)) {
      setValidationError("Selected point must stay within EB Magalona.");
      return;
    }

    setValidationError(null);
    onChange({ latitude, longitude });
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
        {displayError ? <p className="text-sm font-medium text-red-700">{displayError}</p> : null}
      </div>
    </div>
  );
}
