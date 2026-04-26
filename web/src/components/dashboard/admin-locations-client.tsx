"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { BusinessMap, BusinessMapLegend } from "./business-map";
import type { GeoMapLocationRecord } from "@/lib/locations";

interface AdminLocationsClientProps {
  initialLocations: GeoMapLocationRecord[];
  initialSubmissions: GeoMapLocationRecord[];
  initialHiddenOutsideBoundaryCount: number;
  initialPendingCount: number;
  initialRejectedCount: number;
  canManage: boolean;
  viewerRole: "ADMIN" | "BPLO_OFFICE";
}

export function AdminLocationsClient({
  initialLocations,
  initialSubmissions,
  initialHiddenOutsideBoundaryCount,
  initialPendingCount,
  initialRejectedCount,
  canManage,
  viewerRole,
}: AdminLocationsClientProps) {
  const [locations, setLocations] = useState<GeoMapLocationRecord[]>(initialLocations);
  const [submissions, setSubmissions] = useState<GeoMapLocationRecord[]>(initialSubmissions);
  const [hiddenOutsideBoundaryCount, setHiddenOutsideBoundaryCount] = useState(
    initialHiddenOutsideBoundaryCount
  );
  const [pendingCount, setPendingCount] = useState(initialPendingCount);
  const [rejectedCount, setRejectedCount] = useState(initialRejectedCount);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const canReview = viewerRole === "ADMIN" || viewerRole === "BPLO_OFFICE";

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
      setSubmissions(data.submissions ?? []);
      setPendingCount(data.pendingCount ?? 0);
      setRejectedCount(data.rejectedCount ?? 0);
      setHiddenOutsideBoundaryCount(data.hiddenOutsideBoundaryCount ?? 0);
    } catch {
      toast.error("Failed to fetch business locations");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReview = async (id: string, action: "APPROVE" | "REJECT") => {
    const reviewNotes =
      action === "REJECT"
        ? window.prompt("Optional rejection note for the applicant:", "") ?? undefined
        : undefined;

    if (action === "REJECT" && reviewNotes === undefined) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewNotes: reviewNotes?.trim() || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to review location");
        return;
      }

      toast.success(action === "APPROVE" ? "Location approved" : "Location rejected");
      await fetchLocations();
    } catch {
      toast.error("Failed to review location");
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
            Approved business locations within EB Magalona, categorized by the applicant-selected business category.
          </p>
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          {viewerRole === "ADMIN"
            ? "Admin access: view, approve, reject, and delete mapped businesses"
            : "BPLO access: view the map and review applicant location submissions"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          title="Approved Pins"
          value={locations.length}
          description="Visible on the Business Map"
        />
        <MetricCard
          title="Pending Review"
          value={pendingCount}
          description="Waiting for BPLO/Admin approval"
        />
        <MetricCard
          title="Rejected"
          value={rejectedCount}
          description="Needs applicant correction or resubmission"
        />
        <MetricCard
          title="Outside Boundary"
          value={hiddenOutsideBoundaryCount}
          description="Hidden because coordinates fall outside EB Magalona"
        />
      </div>

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

      {hiddenOutsideBoundaryCount > 0 ? (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6 text-sm text-yellow-900">
            {hiddenOutsideBoundaryCount} submitted or legacy business location
            {hiddenOutsideBoundaryCount === 1 ? " is" : "s are"} outside the EB Magalona boundary
            and cannot appear on the map until corrected.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Location Review Queue</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b text-left text-[var(--text-secondary)]">
                <th className="px-3 py-3 font-medium">Business</th>
                <th className="px-3 py-3 font-medium">Application</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Map Status</th>
                <th className="px-3 py-3 font-medium">Boundary</th>
                <th className="px-3 py-3 font-medium">Coordinates</th>
                <th className="px-3 py-3 font-medium">Notes</th>
                {canReview ? <th className="px-3 py-3 font-medium">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={canReview ? 8 : 7}
                    className="px-3 py-6 text-center text-[var(--text-secondary)]"
                  >
                    No pending or rejected location submissions.
                  </td>
                </tr>
              ) : (
                submissions.map((location) => (
                  <tr key={location.id} className="border-b align-top">
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <p className="font-medium text-[var(--text-primary)]">
                          {location.label || location.application?.businessName || "Unnamed business"}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {location.application?.businessAddress || "No address available"}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      <div className="space-y-1">
                        <p>{location.application?.applicationNumber || "N/A"}</p>
                        <StatusBadge status={location.application?.status || "UNKNOWN"} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: location.pinColor }}
                        />
                        <span>{location.businessCategoryLabel}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={location.status || "UNKNOWN"} />
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {location.isWithinBoundary ? "Inside EB Magalona" : "Outside boundary"}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-[var(--text-primary)]">
                      {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {location.reviewNotes || "No notes yet"}
                    </td>
                    {canReview ? (
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleReview(location.id, "APPROVE")}
                            disabled={loading || !location.isWithinBoundary}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(location.id, "REJECT")}
                            disabled={loading}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved Business Locations</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b text-left text-[var(--text-secondary)]">
                <th className="px-3 py-3 font-medium">Business</th>
                <th className="px-3 py-3 font-medium">Application</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Permit/Application</th>
                <th className="px-3 py-3 font-medium">Address</th>
                <th className="px-3 py-3 font-medium">Coordinates</th>
                {canManage ? <th className="px-3 py-3 font-medium">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 7 : 6}
                    className="px-3 py-6 text-center text-[var(--text-secondary)]"
                  >
                    No approved business locations are currently visible on the map.
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
                          <span>
                            {location.application?.lineOfBusiness || location.application?.businessType || "Business type not set"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {location.application?.applicationNumber || "N/A"}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: location.pinColor }}
                        />
                        <span>{location.businessCategoryLabel}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <StatusBadge
                          status={
                            location.application?.permit?.status ||
                            location.application?.status ||
                            "UNKNOWN"
                          }
                        />
                        <p className="text-xs text-[var(--text-secondary)]">
                          {location.applicationStatusLabel}
                        </p>
                      </div>
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
              Delete Approved Location?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This will remove the selected approved business location from the map.
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

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-[var(--text-primary)]">
          {value}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </CardContent>
    </Card>
  );
}
