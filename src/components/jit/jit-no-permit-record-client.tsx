"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { actionButtonStyles } from "@/components/ui/action-button";
import { SectionCard } from "@/components/ui/section-card";
import { InfoBanner } from "@/components/ui/info-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { EB_MAGALONA_CENTER } from "@/lib/eb-magalona";
import { LINE_OF_BUSINESS_OPTIONS } from "@/lib/business-options";

const LeafletBusinessMap = dynamic(
  () => import("@/components/maps/leaflet-business-map").then((mod) => mod.LeafletBusinessMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[440px] w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
    ),
  }
);

interface NoPermitRecord {
  id: string;
  businessName: string;
  personAttended: string;
  lineOfBusiness: string;
  remarks?: string;
  latitude: number;
  longitude: number;
  address?: string;
  createdAt: string;
  createdBy: { name: string };
}

export function JitNoPermitRecordClient() {
  const [records, setRecords] = useState<NoPermitRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    personAttended: "",
    lineOfBusiness: "",
    remarks: "",
    latitude: Number(EB_MAGALONA_CENTER.latitude),
    longitude: Number(EB_MAGALONA_CENTER.longitude),
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadRecords() {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/jit/no-permit-record", { cache: "no-store" });
      const data = (await response.json()) as { records?: NoPermitRecord[]; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to load no-permit records");
        setIsLoading(false);
        return;
      }

      setRecords(data.records ?? []);
      setIsLoading(false);
    }

    void loadRecords();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const response = await fetch("/api/jit/no-permit-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      alert(data.error ?? "Failed to create record");
      setIsSubmitting(false);
      return;
    }

    const data = (await response.json()) as { record: NoPermitRecord };
    setRecords([data.record, ...records]);
    setShowForm(false);
    setFormData({
      businessName: "",
      personAttended: "",
      lineOfBusiness: "",
      remarks: "",
      latitude: Number(EB_MAGALONA_CENTER.latitude),
      longitude: Number(EB_MAGALONA_CENTER.longitude),
      address: "",
    });
    setIsSubmitting(false);
  }

  function handleMapSelect(coords: { latitude: number; longitude: number }) {
    setFormData((prev) => ({
      ...prev,
      latitude: coords.latitude,
      longitude: coords.longitude,
    }));
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const markers = records.map((rec) => ({
    id: rec.id,
    latitude: rec.latitude,
    longitude: rec.longitude,
    title: rec.businessName,
    subtitle: rec.personAttended,
  }));

  function toShortDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <section className="space-y-6">
      <InfoBanner
        title="No Permit Record"
        description="Record businesses found during JIT inspections that do not have an existing business permit record. These are for reference and inspection tracking only."
        variant="info"
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">No Permit Records List</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className={actionButtonStyles("primary", "sm")}
        >
          <Plus className="h-4 w-4" />
          Add Record
        </button>
      </div>

      {showForm && (
        <SectionCard title="Add New No Permit Record" description="Enter details about the business found without a permit record">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Business Name *</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Enter business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Person Attended *</label>
              <input
                type="text"
                required
                value={formData.personAttended}
                onChange={(e) => setFormData((prev) => ({ ...prev, personAttended: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Name of person attended during inspection"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Line of Business *</label>
              <select
                required
                value={formData.lineOfBusiness}
                onChange={(e) => setFormData((prev) => ({ ...prev, lineOfBusiness: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">-- Select line of business --</option>
                {LINE_OF_BUSINESS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Address (optional)</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Enter address or description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Remarks (optional)</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="Additional notes or observations"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Location Pin on Map *</label>
              <p className="text-xs text-slate-600 mb-2">Current: Lat {formData.latitude.toFixed(6)}, Lng {formData.longitude.toFixed(6)}</p>
              <LeafletBusinessMap
                markers={[
                  {
                    id: "current",
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    title: formData.businessName || "Location",
                    subtitle: formData.personAttended || "Current location",
                  },
                ]}
                center={[formData.latitude, formData.longitude]}
                onSelectPosition={handleMapSelect}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={actionButtonStyles("primary", "sm")}
              >
                {isSubmitting ? "Saving..." : "Save Record"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={actionButtonStyles("secondary", "sm")}
              >
                Cancel
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {records.length === 0 ? (
        <EmptyState
          title="No records yet"
          description="Add your first no-permit record from an inspection."
          action={
            <button onClick={() => setShowForm(true)} className={actionButtonStyles("primary", "sm")}>
              <Plus className="h-4 w-4" />
              Add Record
            </button>
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-left font-medium text-slate-700">Business Name</th>
                  <th className="py-3 px-4 text-left font-medium text-slate-700">Person Attended</th>
                  <th className="py-3 px-4 text-left font-medium text-slate-700">Line of Business</th>
                  <th className="py-3 px-4 text-left font-medium text-slate-700">Created Date</th>
                  <th className="py-3 px-4 text-left font-medium text-slate-700">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-900 font-medium">{rec.businessName}</td>
                    <td className="py-3 px-4 text-slate-700">{rec.personAttended}</td>
                    <td className="py-3 px-4 text-slate-700">{rec.lineOfBusiness}</td>
                    <td className="py-3 px-4 text-slate-600">{toShortDate(rec.createdAt)}</td>
                    <td className="py-3 px-4 text-slate-600">{rec.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SectionCard title="No Permit Records Map" description="Visual reference of all recorded locations">
            <LeafletBusinessMap
              markers={markers}
              center={[EB_MAGALONA_CENTER.latitude, EB_MAGALONA_CENTER.longitude]}
            />
          </SectionCard>
        </>
      )}
    </section>
  );
}
