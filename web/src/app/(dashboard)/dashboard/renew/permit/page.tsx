"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

interface PermitInfo {
  id: string;
  permitNumber: string;
  businessName: string;
  businessType: string;
  businessAddress: string;
  businessCity?: string;
  businessProvince?: string;
  expiryDate: string;
}

export default function RenewalFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const permitId = searchParams?.get("permitId");

  const [permit, setPermit] = useState<PermitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [grossSales, setGrossSales] = useState("");

  const fetchPermit = useCallback(async () => {
    if (!permitId) {
      setError("No permit selected");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/permits/${permitId}`);
      const data = await res.json();
      if (res.ok) {
        setPermit(data.permit);
      } else {
        setError("Permit not found");
      }
    } catch {
      setError("Failed to load permit details");
    } finally {
      setLoading(false);
    }
  }, [permitId]);

  useEffect(() => {
    fetchPermit();
  }, [fetchPermit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!grossSales) {
      setError("Gross Sales is required for renewal");
      return;
    }

    if (!permit) {
      setError("Permit information not loaded");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/applications/renewal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RENEWAL",
          previousPermitId: permit.id,
          grossSales: parseFloat(grossSales),
          businessName: permit.businessName,
          businessType: permit.businessType,
          businessAddress: permit.businessAddress,
          businessCity: permit.businessCity || "",
          businessProvince: permit.businessProvince || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.reason || data.error || "Failed to create renewal application");
        return;
      }

      toast.success("Renewal application created successfully!");
      router.push(`/dashboard/applications/${data.application.id}`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading permit..." />
      </div>
    );
  }

  if (!permit) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{error || "Permit not found"}</Alert>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Permits
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Renew Business Permit</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Complete the renewal form for {permit.businessName}
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Permit Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-sm text-[var(--text-secondary)]">Permit Number</label>
              <p className="mt-1 font-mono font-medium">{permit.permitNumber}</p>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)]">Business Name</label>
              <p className="mt-1 font-medium">{permit.businessName}</p>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)]">Expiry Date</label>
              <p className="mt-1 font-medium">{new Date(permit.expiryDate).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Renewal Details */}
        <Card>
          <CardHeader>
            <CardTitle>Renewal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="grossSales" className="block text-sm font-medium text-[var(--text-primary)]">
                Annual Gross Sales / Income <span className="text-[var(--danger)]">*</span>
              </label>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Enter your annual gross sales for the previous fiscal year
              </p>
              <div className="mt-2 flex items-center">
                <span className="text-[var(--text-secondary)] mr-2">₱</span>
                <Input
                  id="grossSales"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={grossSales}
                  onChange={(e) => setGrossSales(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="rounded-lg bg-[var(--accent-light)] p-4 text-sm text-blue-900">
              <p className="font-medium mb-3"><strong>Required Documents and Clearances</strong></p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-blue-900">Proof of Annual Gross Sales / Income (1 copy)</p>
                  <ul className="list-disc ml-5 mt-1 text-xs space-y-1">
                    <li>Audited Financial Statement (AFS), or</li>
                    <li>Sworn Declaration of gross sales / income, or</li>
                    <li>Tax Return (if required to file with BIR)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-blue-900">BPLO-Managed Compliance Requirements (1 certified copy each)</p>
                  <ul className="list-disc ml-5 mt-1 text-xs space-y-1">
                    <li>Updated sanitary permit or sanitary clearance</li>
                    <li>Environmental compliance document, if applicable</li>
                    <li>Engineering or occupancy-related supporting document, if applicable</li>
                    <li>Fire Safety Inspection Certificate</li>
                    <li>Property-related tax or occupancy clearance, if applicable</li>
                    <li>Utility or service compliance document, if applicable</li>
                    <li>Any BPLO-required supporting document specific to your business activity</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs mt-3 pt-3 border-t border-blue-200"><strong>Note:</strong> You will upload these documents on the next page after submitting this form.</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {submitting ? "Creating Application..." : "Create Renewal Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}
