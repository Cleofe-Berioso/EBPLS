"use client";

import dynamic from "next/dynamic";
import { GEO_MAP_LEGEND, GEO_MAP_PIN_COLORS, type GeoMapLocationRecord } from "@/lib/locations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BusinessMapProps {
  locations: GeoMapLocationRecord[];
}

const BusinessMapContent = dynamic(
  () =>
    import("./business-map-content").then((mod) => mod.BusinessMapContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

export function BusinessMap({ locations }: BusinessMapProps) {
  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-gray-200">
      <BusinessMapContent locations={locations} />
    </div>
  );
}

export function BusinessMapLegend() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Business Category Legend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {GEO_MAP_LEGEND.map((item) => (
            <div
              key={item.tone}
              className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5"
            >
              <span
                className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: GEO_MAP_PIN_COLORS[item.tone] }}
              />
              <span className="text-sm text-[var(--text-secondary)]">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-900">
          EB Magalona only. Only BPLO-approved business locations inside the allowed boundary appear on the map.
        </div>
      </CardContent>
    </Card>
  );
}
