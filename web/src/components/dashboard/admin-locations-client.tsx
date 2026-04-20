"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_MAP_CENTER } from "@/lib/locations";
import { BusinessMap } from "./business-map";

// Define types directly to avoid Prisma import issues
interface BusinessLocation {
  id: string;
  applicationId: string;
  latitude: number;
  longitude: number;
  label: string | null;
  businessType: string | null;
  markerColor: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface LocationWithApp extends BusinessLocation {
  application?: {
    id: string;
    applicationNumber: string;
    businessName: string;
    businessType: string;
  };
}

interface AdminLocationsClientProps {
  initialLocations: LocationWithApp[];
}

export function AdminLocationsClient({
  initialLocations,
}: AdminLocationsClientProps) {
  const [locations, setLocations] = useState<LocationWithApp[]>(initialLocations);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialLocations.length);

  const [formData, setFormData] = useState({
    applicationId: "",
    latitude: DEFAULT_MAP_CENTER[0].toString(),
    longitude: DEFAULT_MAP_CENTER[1].toString(),
    label: "",
    businessType: "",
    markerColor: "blue",
  });

  const fetchLocations = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/locations?page=${p}&take=15`);
      const data = await res.json();
      setLocations(data.locations);
      setTotal(data.total);
      setPage(p);
    } catch (error) {
      toast.error("Failed to fetch locations");
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
          businessType: formData.businessType || null,
          markerColor: formData.markerColor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add location");
        return;
      }

      toast.success("Location added successfully");
      setFormData({
        applicationId: "",
        latitude: DEFAULT_MAP_CENTER[0].toString(),
        longitude: DEFAULT_MAP_CENTER[1].toString(),
        label: "",
        businessType: "",
        markerColor: "blue",
      });
      fetchLocations(1);
    } catch (error) {
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
      fetchLocations(page);
    } catch (error) {
      toast.error("Failed to delete location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Location Management</h1>
        <p className="text-gray-600 mt-1">
          Manage business locations on the map
        </p>
      </div>

      {/* Map and Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="h-96 lg:h-[500px]">
          <BusinessMap locations={locations} />
        </div>

        {/* Form */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Add Location</h2>
          <form onSubmit={handleAddLocation} className="space-y-3">
            <div>
              <label className="text-sm font-medium">
                Application ID *{" "}
                <span className="text-xs text-gray-500">(v1: temporary text input)</span>
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
              <p className="text-xs text-gray-500 mt-1">
                Copy from applications list. V2 upgrade: dropdown selector with
                autocomplete
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Latitude *</label>
                <Input
                  type="number"
                  placeholder="10.8779"
                  step="0.0001"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-gray-500 mt-1">10.8349–10.9209</p>
              </div>
              <div>
                <label className="text-sm font-medium">Longitude *</label>
                <Input
                  type="number"
                  placeholder="122.9779"
                  step="0.0001"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-gray-500 mt-1">122.9359–123.0199</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Label (Optional)</label>
              <Input
                type="text"
                placeholder="e.g., Juan's Store"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Business Type</label>
              <select
                value={formData.businessType}
                onChange={(e) =>
                  setFormData({ ...formData, businessType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select type</option>
                <option value="Retail">Retail</option>
                <option value="Service">Service</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Food">Food</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Location"}
            </button>
          </form>
        </div>
      </div>

      {/* Locations Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Application</th>
              <th className="text-left px-4 py-3 font-semibold">Label</th>
              <th className="text-left px-4 py-3 font-semibold">Coordinates</th>
              <th className="text-left px-4 py-3 font-semibold">Type</th>
              <th className="text-left px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No locations yet
                </td>
              </tr>
            ) : (
              locations.map((location) => (
                <tr key={location.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <p className="font-medium">
                        {location.application?.businessName}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {location.application?.applicationNumber}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {location.label || "–"}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">
                    {location.latitude.toFixed(4)},{" "}
                    {location.longitude.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {location.businessType || "–"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setDeleteConfirmId(location.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Location?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteConfirmId && handleDeleteLocation(deleteConfirmId)
                }
                disabled={loading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
