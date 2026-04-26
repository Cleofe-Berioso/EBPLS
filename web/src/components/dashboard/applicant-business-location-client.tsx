"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import {
  BUSINESS_CATEGORY_VALUES,
  DEFAULT_MAP_CENTER,
  GEO_MAP_CATEGORY_LABELS,
  type GeoMapLocationRecord,
} from "@/lib/locations";

interface ApplicantLocationApplication {
  id: string;
  applicationNumber: string;
  businessName: string;
  businessType: string;
  lineOfBusiness: string | null;
  businessAddress: string;
  status: string;
  permitStatus: string | null;
  location: GeoMapLocationRecord | null;
}

interface ApplicantBusinessLocationClientProps {
  initialApplications: ApplicantLocationApplication[];
}

const defaultFormState = {
  latitude: DEFAULT_MAP_CENTER[0].toString(),
  longitude: DEFAULT_MAP_CENTER[1].toString(),
  businessCategory: "" as "" | (typeof BUSINESS_CATEGORY_VALUES)[number],
  label: "",
};

export function ApplicantBusinessLocationClient({
  initialApplications,
}: ApplicantBusinessLocationClientProps) {
  const searchParams = useSearchParams();
  const requestedApplicationId = searchParams?.get("applicationId") ?? null;
  const [applications, setApplications] = useState(initialApplications);
  const [selectedApplicationId, setSelectedApplicationId] = useState(
    requestedApplicationId && initialApplications.some((app) => app.id === requestedApplicationId)
      ? requestedApplicationId
      : initialApplications[0]?.id ?? ""
  );
  const [formData, setFormData] = useState(defaultFormState);
  const [submitting, setSubmitting] = useState(false);

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedApplicationId) ?? null,
    [applications, selectedApplicationId]
  );

  useEffect(() => {
    if (!selectedApplication) {
      setFormData(defaultFormState);
      return;
    }

    setFormData({
      latitude: selectedApplication.location?.latitude?.toString() ?? defaultFormState.latitude,
      longitude: selectedApplication.location?.longitude?.toString() ?? defaultFormState.longitude,
      businessCategory:
        selectedApplication.location?.businessCategory ?? defaultFormState.businessCategory,
      label: selectedApplication.location?.label ?? "",
    });
  }, [selectedApplication]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedApplication) {
      toast.error("Select an eligible released or completed application first.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/business-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          businessCategory: formData.businessCategory,
          label: formData.label || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit business location");
        return;
      }

      toast.success("Business location submitted to BPLO for review.");
      setApplications((current) =>
        current.map((application) =>
          application.id === selectedApplication.id
            ? { ...application, location: data.location }
            : application
        )
      );
    } catch {
      toast.error("Failed to submit business location");
    } finally {
      setSubmitting(false);
    }
  };

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            No eligible businesses yet
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            You can submit a business location only after the related permit/application reaches
            <span className="font-medium text-[var(--text-primary)]"> RELEASED </span>
            or
            <span className="font-medium text-[var(--text-primary)]"> COMPLETED</span>.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Eligible Businesses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {applications.map((application) => (
            <button
              key={application.id}
              type="button"
              onClick={() => setSelectedApplicationId(application.id)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selectedApplicationId === application.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {application.businessName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {application.applicationNumber}
                  </p>
                </div>
                {application.location ? (
                  <StatusBadge status={application.location.status || "UNKNOWN"} />
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                    Not Submitted
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {application.lineOfBusiness || application.businessType}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {application.location?.locationStatusLabel || "No location submitted yet"}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Location Submission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem label="Business">{selectedApplication?.businessName}</DetailItem>
              <DetailItem label="Application No.">{selectedApplication?.applicationNumber}</DetailItem>
              <DetailItem label="Business Type">
                {selectedApplication?.lineOfBusiness || selectedApplication?.businessType}
              </DetailItem>
              <DetailItem label="Current Category">
                {selectedApplication?.location?.businessCategoryLabel || "Not selected yet"}
              </DetailItem>
              <DetailItem label="Permit/Application Status">
                <StatusBadge status={selectedApplication?.permitStatus || selectedApplication?.status || "UNKNOWN"} />
              </DetailItem>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Address</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {selectedApplication?.businessAddress}
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Submit the business coordinates inside EB Magalona. Your location will only appear on the
              Business Map after BPLO approves it.
            </div>
            {selectedApplication?.location ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[var(--text-secondary)]">
                Current submission:
                <span className="ml-2 font-medium text-[var(--text-primary)]">
                  {selectedApplication.location.locationStatusLabel}
                </span>
                {selectedApplication.location.reviewNotes ? (
                  <p className="mt-2 text-sm text-[var(--text-primary)]">
                    Review note: {selectedApplication.location.reviewNotes}
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enter Coordinates</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="0.000001"
                    value={formData.latitude}
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, latitude: event.target.value }))
                    }
                    required
                  />
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Allowed range: 10.834893 to 10.920893
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
                    onChange={(event) =>
                      setFormData((current) => ({ ...current, longitude: event.target.value }))
                    }
                    required
                  />
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Allowed range: 122.935881 to 123.019881
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Business Category
                </label>
                <select
                  value={formData.businessCategory}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      businessCategory: event.target.value as (typeof BUSINESS_CATEGORY_VALUES)[number],
                    }))
                  }
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs"
                >
                  <option value="" disabled>
                    Select business category
                  </option>
                  {BUSINESS_CATEGORY_VALUES.map((category) => (
                    <option key={category} value={category}>
                      {GEO_MAP_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  This selected category is used directly for the GeoMap pin color and legend.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Optional map label
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Main storefront"
                  value={formData.label}
                  onChange={(event) =>
                    setFormData((current) => ({ ...current, label: event.target.value }))
                  }
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !selectedApplication || !formData.businessCategory}
              >
                {submitting ? "Submitting..." : "Submit to BPLO"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
      <div className="mt-1 text-sm text-[var(--text-secondary)]">{children}</div>
    </div>
  );
}
