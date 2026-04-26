"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { DEFAULT_MAP_CENTER, type GeoMapLocationRecord } from "@/lib/locations";
import { BusinessMap, BusinessMapLegend } from "./business-map";

interface AdminLocationsClientProps {
  initialLocations: GeoMapLocationRecord[];
  initialHiddenOutsideBoundaryCount: number;
  canManage: boolean;
  viewerRole: "ADMIN" | "BPLO_OFFICE";
}

export function AdminLocationsClient({
  initialLocations,
  initialHiddenOutsideBoundaryCount,
  canManage,
  viewerRole,
}: AdminLocationsClientProps) {
  const [locations, setLocations] = useState<GeoMapLocationRecord[]>(initialLocations);
  const [hiddenOutsideBoundaryCount, setHiddenOutsideBoundaryCount] = useState(
    initialHiddenOutsideBoundaryCount
  );
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    applicationId: "",
    latitude: DEFAULT_MAP_CENTER[0].toString(),
    longitude: DEFAULT_MAP_CENTER[1].toString(),
    label: "",
  });

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/locations", {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to fetch business locations");
        return;
      }

      setLocations(data.locations ?? []);
      setHiddenOutsideBoundaryCount(data.hiddenOutsideBoundaryCount ?? 0);
    } catch {
      toast.error("Failed to fetch business locations");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: formData.applicationId,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          label: formData.label || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add location");
        return;
      }

      toast.success("Location saved");
      setFormData({
        applicationId: "",
        latitude: DEFAULT_MAP_CENTER[0].toString(),
        longitude: DEFAULT_MAP_CENTER[1].toString(),
        label: "",
      });
      await fetchLocations();
    } catch {
      toast.error("Failed to add location");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete location");
        return;
      }

      toast.success("Location deleted");
      setDeleteConfirmId(null);
      await fetchLocations();
    } catch {
      toast.error("Failed to delete location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Business GeoMap
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Registered business locations shown only within the EB Magalona area.
          </p>
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          {canManage ? "Admin access: manage and review locations" : "BPLO access: read-only map view"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Visible Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {locations.length}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Pins currently displayed on the map
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Boundary Filtered</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {hiddenOutsideBoundaryCount}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Hidden because coordinates fall outside EB Magalona
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Viewer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {viewerRole === "ADMIN" ? "Admin" : "BPLO"}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Applicant users do not get map management access
            </p>
          </CardContent>
        </Card>
      </div>

      {hiddenOutsideBoundaryCount > 0 ? (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6 text-sm text-yellow-900">
            {hiddenOutsideBoundaryCount} mapped business
            {hiddenOutsideBoundaryCount === 1 ? " is" : "es are"} outside the
            EB Magalona boundary and hidden from the map pins.
          </CardContent>
        </Card>
      ) : null}

      <div className={`grid grid-cols-1 gap-6 ${canManage ? "xl:grid-cols-[minmax(0,2fr)_360px]" : ""}`}>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>EB Magalona Business Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="h-[420px] sm:h-[520px]">
                <BusinessMap locations={locations} />
              </div>
              <div className="lg:h-[520px]">
                <BusinessMapLegend />
              </div>
            </div>
          </CardContent>
        </Card>

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle>Add Business Location</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddLocation} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    Application ID
                  </label>
                  <Input
                    type="text"
                    placeholder="cuid..."
                    value={formData.applicationId}
                    onChange={(e) =>
                      setFormData({ ...formData, applicationId: e.target.value })
                    }
                    required
                  />
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    The business name, address, type, and status come from the linked application.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                      Latitude
                    </label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: e.target.value })
                      }
                      required
                    />
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      10.834893 to 10.920893
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                      Longitude
                    </label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: e.target.value })
                      }
                      required
                    />
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      122.935881 to 123.019881
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    Optional Label
                  </label>
                  <Input
                    type="text"
                    placeholder="Map label override"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Save Location"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mapped Businesses</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b text-left text-[var(--text-secondary)]">
                <th className="px-3 py-3 font-medium">Business</th>
                <th className="px-3 py-3 font-medium">Application</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Address</th>
                <th className="px-3 py-3 font-medium">Coordinates</th>
                {canManage ? (
                  <th className="px-3 py-3 font-medium">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 7 : 6}
                    className="px-3 py-6 text-center text-[var(--text-secondary)]"
                  >
                    No in-boundary business locations found.
                  </td>
                </tr>
              ) : (
                locations.map((location) => (
                  <tr key={location.id} className="border-b align-top">
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <p className="font-medium text-[var(--text-primary)]">
                          {location.label || location.application?.businessName || "Unnamed business"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: location.pinColor }}
                          />
                          <span>{location.pinTone.toUpperCase()} pin</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {location.application?.applicationNumber || "N/A"}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {location.application?.type || "N/A"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge
                        status={
                          location.application?.permit?.status ||
                          location.application?.status ||
                          "UNKNOWN"
                        }
                      />
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {location.application?.businessAddress || "N/A"}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-[var(--text-primary)]">
                      {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                    </td>
                    {canManage ? (
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setDeleteConfirmId(location.id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {deleteConfirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Location?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This will remove the map point for the selected business.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteConfirmId && handleDeleteLocation(deleteConfirmId)
                }
                disabled={loading}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
